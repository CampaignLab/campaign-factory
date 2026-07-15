// executeAgentTurn — the entry point W2's graph calls for every producing/
// research/analysis agent (NOT the synthesis reviewer; that uses reviewer.ts).
// Responsibilities: assemble bounded context from accepted state + referenced
// claims/sources (never the raw event log); route model+effort per roster;
// acquire the concurrency gate around the model call; run the turn with one
// visible operational retry; emit work/source/evidence Factory Events; and map
// the model output into the frozen AgentResult via the agent's contract. In
// mock mode it delegates to mock.ts and makes zero model calls.

import type {
  AgentKey,
  AgentResult,
  AgentTaskEnvelope,
  AgentTerminalStatus,
} from "@web/lib/factory/contracts/index.js";
// Value import direct from its module (contracts barrel uses `export *`).
import { JOURNEY_STEPS } from "@web/lib/factory/contracts/journey.js";
import { getAgentContract, type AgentResultBody } from "@web/lib/factory/agents/index.js";
import { getClaims, getSources } from "@web/lib/factory/store/evidence.js";
import { getAcceptedState } from "@web/lib/factory/store/state-versions.js";
import type { AgentDef } from "@web/lib/factory/contracts/index.js";
import type { AgentTurnFn, ExecutorDeps } from "./deps.js";
import { buildTools } from "./gateway.js";
import {
  diag,
  runModelTurn,
  TurnAbortedError,
  TurnTimeoutError,
  type ModelTurnResult,
  type ModelTurnSpec,
} from "./model-call.js";
import { WorkEmitter } from "./work.js";
import { mockAgentTurn } from "./mock.js";

export const executeAgentTurn: AgentTurnFn = async (envelope, deps) => {
  const def = deps.agentDef;
  const journeyStep = envelope.journeySteps[0];
  const work = new WorkEmitter(deps, def.key, journeyStep);

  if (deps.modelMode === "mock") {
    return mockAgentTurn(envelope, deps, work);
  }

  const contract = getAgentContract(def.key as AgentKey);
  const mode: "public" | "presenter" = envelope.batchId ? "presenter" : "public";
  const kind: "model" | "research" = def.toolPolicy === "none" ? "model" : "research";
  const release = await deps.gate.acquire({ campaignId: envelope.campaignId, mode, kind });
  try {
    const contextExtracts = await assembleContext(envelope, deps, def);
    const { tools } = buildTools(def);
    const spec: ModelTurnSpec = {
      system: contract.system(def),
      userText: contract.userMessage(envelope, contextExtracts),
      schema: contract.schema,
      structuredOutput: contract.structuredOutput,
      model: def.model,
      effort: def.effort,
      adaptiveThinking: def.model !== "claude-haiku-4-5", // Haiku has no adaptive thinking
      maxOutputTokens: def.maxOutputTokens,
      timeoutMs: def.timeoutMs,
      tools,
      def,
      campaignId: envelope.campaignId,
      agentRunId: envelope.agentRunId,
      batchId: envelope.batchId,
      journeyStep,
      work,
    };

    const turn = await runWithOperationalRetry(spec, deps, work);
    if (!turn) {
      work.flush();
      return failedResult(envelope, "The agent could not complete after a retry (timeout or provider failure).");
    }
    const body = contract.toResult(turn.raw, { envelope, def });
    await emitEvidenceEvents(body, deps, journeyStep, def.key);
    work.flush();
    return { agentRunId: envelope.agentRunId, status: terminalStatus(body), ...body };
  } finally {
    release();
    work.flush();
  }
};

// One visible operational retry on timeout / provider failure. Cancellation
// (TurnAbortedError) is rethrown, never retried. Returns null after a failed
// retry so the caller can emit a failed result rather than crash the node.
async function runWithOperationalRetry(
  spec: ModelTurnSpec,
  deps: ExecutorDeps,
  work: WorkEmitter,
): Promise<ModelTurnResult | null> {
  try {
    return await runModelTurn(spec, deps);
  } catch (e) {
    diag(`${spec.def.key} attempt 1 failed`, e);
    if (e instanceof TurnAbortedError) throw e;
    void deps.emit({
      type: "agent.retry",
      journeyStep: spec.journeyStep,
      payload: {
        summary: `Retrying after ${e instanceof TurnTimeoutError ? "a timeout" : "a provider error"}`,
        verb: "retrying",
        agentKey: spec.def.key,
      },
    });
    work.work("Retrying", "retrying");
    try {
      return await runModelTurn(spec, deps);
    } catch (e2) {
      diag(`${spec.def.key} attempt 2 failed`, e2);
      if (e2 instanceof TurnAbortedError) throw e2;
      return null;
    }
  }
}

// Bounded context: problem + place, accepted (or in-review) sections with their
// Step Reports, referenced claims, and their sources — trimmed to the roster
// inputTokenBudget. Never the raw event log; never all source bodies.
async function assembleContext(envelope: AgentTaskEnvelope, deps: ExecutorDeps, def: AgentDef): Promise<string> {
  const state = await getAcceptedState(deps.sql, envelope.campaignId);
  const budgetChars = Math.max(2000, def.inputTokenBudget * 4);
  const parts: string[] = [`PROBLEM: ${state.problem}`, `PLACE: ${state.place}`, `Accepted state version: ${state.version}`];

  const secParts: string[] = [];
  for (const s of JOURNEY_STEPS) {
    const sec = state.sections?.[s.key];
    if (!sec || sec.status === "empty") continue;
    if (!sec.content && sec.status !== "accepted" && sec.status !== "needs_verification") continue;
    secParts.push(
      `--- SECTION ${s.step} ${s.key} [${sec.status}] ---\n${compact(sec.content, 3000)}${
        sec.stepReport ? `\nStep report: ${sec.stepReport}` : ""
      }`,
    );
  }
  if (secParts.length) parts.push(`ACCEPTED SECTIONS:\n${secParts.join("\n\n")}`);

  const claimIds = envelope.evidenceRefs?.length ? envelope.evidenceRefs : undefined;
  const claims = await getClaims(deps.sql, envelope.campaignId, claimIds);
  if (claims.length) {
    const shown = claims.slice(0, 60);
    parts.push(
      `EVIDENCE CLAIMS:\n${shown
        .map(
          (c) =>
            `- [${c.status}${c.loadBearing ? ", load-bearing" : ""}] ${c.text}${
              c.sourceIds.length ? ` (sources: ${c.sourceIds.join(", ")})` : ""
            }`,
        )
        .join("\n")}`,
    );
    const srcIds = Array.from(new Set(shown.flatMap((c) => c.sourceIds)));
    if (srcIds.length) {
      const sources = await getSources(deps.sql, envelope.campaignId, srcIds);
      if (sources.length) {
        parts.push(
          `SOURCES:\n${sources
            .map((s) => `- ${s.id} [tier ${s.tier}, ${s.retrievalStatus}] ${s.title} — ${s.organisation} (${s.url})`)
            .join("\n")}`,
        );
      }
    }
  }

  let text = parts.join("\n\n");
  if (text.length > budgetChars) text = `${text.slice(0, budgetChars)}\n\n[context truncated to fit the agent's input budget]`;
  return text;
}

function compact(content: unknown, cap: number): string {
  if (content == null) return "(empty)";
  let s: string;
  try {
    s = typeof content === "string" ? content : JSON.stringify(content);
  } catch {
    s = String(content);
  }
  return s.length > cap ? `${s.slice(0, cap)}…` : s;
}

async function emitEvidenceEvents(
  body: AgentResultBody,
  deps: ExecutorDeps,
  journeyStep: number | undefined,
  agentKey: string,
): Promise<void> {
  if (body.claims.length) {
    const lb = body.claims.filter((c) => c.loadBearing).length;
    await deps.emit({
      type: "evidence.found",
      journeyStep,
      payload: {
        summary: `Recorded ${body.claims.length} claim${body.claims.length === 1 ? "" : "s"}${lb ? `, ${lb} load-bearing` : ""}`,
        verb: "recorded",
        agentKey,
      },
    });
  }
  if (body.conflict) {
    await deps.emit({
      type: "evidence.conflicted",
      journeyStep,
      payload: { summary: `Conflict: ${body.conflict.description.slice(0, 140)}`, verb: "flagged", agentKey, claimIds: body.conflict.claimIds },
    });
  }
  const gaps = body.claimDecisions?.gaps.length ?? 0;
  if (gaps) {
    await deps.emit({ type: "evidence.gap", journeyStep, payload: { summary: `${gaps} evidence gap${gaps === 1 ? "" : "s"} remain`, verb: "flagged", agentKey } });
  } else if (body.unknowns.length) {
    await deps.emit({
      type: "evidence.gap",
      journeyStep,
      payload: { summary: `${body.unknowns.length} open question${body.unknowns.length === 1 ? "" : "s"}`, verb: "flagged", agentKey },
    });
  }
}

function terminalStatus(body: AgentResultBody): AgentTerminalStatus {
  // A turn that produced neither a proposal nor a claim decision is partial.
  if (body.proposals.length === 0 && !body.claimDecisions) return "partial";
  return "complete";
}

function failedResult(envelope: AgentTaskEnvelope, reason: string): AgentResult {
  return {
    agentRunId: envelope.agentRunId,
    status: "failed",
    workSummary: reason,
    claims: [],
    proposals: [],
    unknowns: [reason],
    confidence: "low",
    handoffs: [],
  };
}
