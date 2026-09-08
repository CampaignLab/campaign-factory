// RunContext: the non-serialisable per-STEP dependencies for the Workflow
// executor — the worker's RuntimeContext (worker/src/graph/context.ts) minus
// the LangGraph config plumbing. Each "use step" invocation rebuilds a fresh
// context via makeRunContext; durable state lives in the workflow function.

import { agentDefFor } from "@/lib/factory/contracts/roster";
import type { RunProfile } from "@/lib/factory/contracts/api";
import type { ModelProvider } from "@/lib/anthropic";
import { MAX_JUDGEMENT_REQUESTS_PER_RUN } from "@/lib/factory/contracts/state";
import { sql, type Sql } from "./db";
import { Emitter } from "./emit";
import { FactoryGate } from "./gate";
import type { Gate, RecordUsage, AgentTurnFn } from "./agents/deps";
import type { ReviewFn, QAFn } from "./review-contract";
import { loadRuntimeAgents, type ModelMode } from "./loader";
import * as store from "./store";

export interface RunContext {
  sql: Sql;
  emitter: Emitter;
  gate: Gate;
  recordUsage: RecordUsage;
  modelMode: ModelMode;
  mode: "public" | "presenter";
  profile: RunProfile;
  batchId?: string;
  signal: AbortSignal;
  apiKey?: string;
  apiProvider?: ModelProvider;
  executeAgentTurn: AgentTurnFn;
  review: ReviewFn;
  runQA: QAFn;
  judgementSlots: JudgementSlots;
}

// Per-run judgement-cap guard (worker/src/graph/context.ts). One instance per
// STEP here: agents inside a step race under Promise.all (the serialised
// counter guards that); across steps the count is re-loaded from the DB, which
// is the worker's resume behaviour.
export interface JudgementSlots {
  reserve(load: () => Promise<number>): Promise<boolean>;
}

export function makeJudgementSlots(cap: number): JudgementSlots {
  let count: number | null = null;
  let chain: Promise<unknown> = Promise.resolve();
  return {
    reserve(load: () => Promise<number>): Promise<boolean> {
      const next = chain.then(async () => {
        if (count === null) count = await load();
        if (count >= cap) return false;
        count += 1;
        return true;
      });
      chain = next.catch(() => undefined);
      return next;
    },
  };
}

// One gate per function instance (module scope; Fluid reuses instances across
// invocations). Per-campaign caps are fully enforced — a campaign's cluster
// runs inside ONE step. Global/cross-campaign fairness is per-instance only;
// the single-scheduler global gate is a phase-3 item (migration doc).
const instanceGate = new FactoryGate();

export function modelModeFromEnv(): ModelMode {
  return process.env.FACTORY_MODEL_MODE === "mock" ? "mock" : "live";
}

export interface RunSeed {
  campaignId: string;
  batchId?: string;
  mode: "public" | "presenter";
  profile: RunProfile;
  apiKey?: string;
  apiProvider?: ModelProvider;
}

/** Build the per-step context. `signal` aborts in-flight model calls when the
 * step's own deadline approaches; run-level cancellation is observed at node
 * boundaries via the DB status (guard() in nodes.ts), as on the worker. */
export async function makeRunContext(seed: RunSeed, signal: AbortSignal): Promise<RunContext> {
  const s = sql();
  const agents = await loadRuntimeAgents();
  const modelMode = modelModeFromEnv();
  return {
    sql: s,
    emitter: new Emitter(s, seed.campaignId, seed.batchId),
    gate: {
      acquire: (input) => instanceGate.acquire({ ...input, signal }),
    },
    recordUsage: async (u) => {
      await store.appendCost(s, {
        campaignId: u.campaignId,
        batchId: u.batchId,
        agentRunId: u.agentRunId,
        model: u.model,
        kind: "model_call",
        inputTokens: u.inputTokens,
        outputTokens: u.outputTokens,
        searchCount: u.webSearches,
        costUsd: u.costUSD,
      });
    },
    modelMode,
    mode: seed.mode,
    profile: seed.profile,
    batchId: seed.batchId,
    signal,
    apiKey: modelMode === "live" ? (seed.apiKey ?? process.env.ANTHROPIC_API_KEY) : undefined,
    apiProvider: seed.apiProvider ?? "anthropic",
    executeAgentTurn: agents.executeAgentTurn,
    review: agents.review,
    runQA: agents.runQA,
    judgementSlots: makeJudgementSlots(MAX_JUDGEMENT_REQUESTS_PER_RUN),
  };
}

export { agentDefFor };
