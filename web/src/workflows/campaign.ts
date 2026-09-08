// Campaign execution as a Vercel Workflow — phase 2 of the migration
// (docs/product/vercel-workflow-migration.md). The workflow function is a pure
// orchestrator holding the run state (exec/state.ts) as plain locals; each
// graph node from the worker (worker/src/graph/build.ts topology) runs as ONE
// "use step" — the same crash/retry unit as the worker's checkpoint-per-node —
// with a fresh RunContext per step. Semantics ported 1:1: the topology below
// mirrors build.ts, the bounded strategy-revision loop mirrors
// routeAfterStrategy, and the failure path mirrors the pg-boss dead-letter
// handler (a visible Terminal Gap + run.failed, never a hidden failure).
//
// Phase-2 scope: house-key runs only. A BYOK key is NEVER passed through
// workflow arguments (they persist in the Workflow backend; the worker's
// sealed-at-rest guarantee has no equivalent here yet — phase 3 decides).

import { FatalError } from "workflow";
import {
  initialState,
  applyPatch,
  applyPatches,
  type Patch,
  type RunState,
} from "@/lib/factory/exec/state";
import type { AgentKey } from "@/lib/factory/contracts/roster";

export interface CampaignSeed {
  campaignId: string;
  batchId?: string;
  mode: "public" | "presenter";
  profile: "full" | "express";
  problem: string;
  place: string;
}

// ---- Steps (full Node access; one step = one worker graph node) -------------

async function stepInitRun(seed: CampaignSeed): Promise<{ reviewerAgentRunId: string }> {
  "use step";
  const { randomUUID } = await import("node:crypto");
  const { makeRunContext } = await import("@/lib/factory/exec/context");
  const store = await import("@/lib/factory/exec/store");
  const { agentDef } = await import("@/lib/factory/contracts/roster");
  const ctx = await makeRunContext(seed, new AbortController().signal);

  const reviewerAgentRunId = randomUUID();
  await store.createAgentRun(ctx.sql, {
    agentRunId: reviewerAgentRunId,
    campaignId: seed.campaignId,
    batchId: seed.batchId,
    agentKey: "synthesis_reviewer",
    displayName: "Campaign Synthesis Reviewer",
    status: "running",
    journeySteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    model: "claude-sonnet-5",
    effort: "high",
  });
  await ctx.emitter.emit({
    type: "agent.started",
    agentRunId: reviewerAgentRunId,
    payload: {
      summary: "Campaign Synthesis Reviewer started",
      agentKey: "synthesis_reviewer",
      agentDisplayName: "Campaign Synthesis Reviewer",
      detail: { task: agentDef("synthesis_reviewer").responsibility.slice(0, 200) },
    },
  });
  await store.setRunStatus(ctx.sql, seed.campaignId, "running", { markStarted: true });
  await ctx.emitter.emit({
    type: "run.started",
    payload: {
      summary: `Run started: ${seed.problem.slice(0, 80)}`,
      detail: { problem: seed.problem, place: seed.place },
    },
  });
  return { reviewerAgentRunId };
}

async function stepResearchDirector(seed: CampaignSeed, state: RunState): Promise<Patch> {
  "use step";
  const { makeRunContext } = await import("@/lib/factory/exec/context");
  const { researchDirectorNode } = await import("@/lib/factory/exec/nodes");
  return researchDirectorNode(await makeRunContext(seed, new AbortController().signal), state);
}

async function stepSpecialists(seed: CampaignSeed, state: RunState): Promise<Patch> {
  "use step";
  const { makeRunContext } = await import("@/lib/factory/exec/context");
  const { specialistsClusterNode } = await import("@/lib/factory/exec/nodes");
  return specialistsClusterNode(await makeRunContext(seed, new AbortController().signal), state);
}

async function stepCluster(
  seed: CampaignSeed,
  state: RunState,
  keys: AgentKey[],
  sections: string[],
): Promise<Patch> {
  "use step";
  const { makeRunContext } = await import("@/lib/factory/exec/context");
  const { agentClusterNode } = await import("@/lib/factory/exec/nodes");
  return agentClusterNode(await makeRunContext(seed, new AbortController().signal), state, keys, sections);
}

async function stepReviewer(
  seed: CampaignSeed,
  state: RunState,
  pass: "evidence" | "analysis" | "strategy" | "final",
  journeySteps: number[],
): Promise<Patch> {
  "use step";
  const { makeRunContext } = await import("@/lib/factory/exec/context");
  const { reviewerNode } = await import("@/lib/factory/exec/nodes");
  return reviewerNode(await makeRunContext(seed, new AbortController().signal), state, pass, journeySteps);
}

async function stepFinalise(seed: CampaignSeed, state: RunState): Promise<Patch> {
  "use step";
  const { makeRunContext } = await import("@/lib/factory/exec/context");
  const { finaliseNode } = await import("@/lib/factory/exec/finalise");
  return finaliseNode(await makeRunContext(seed, new AbortController().signal), state);
}

// Systemic-failure path — mirrors the worker's dead-letter handler exactly.
async function stepFailRun(seed: CampaignSeed, reason: string): Promise<void> {
  "use step";
  const { makeRunContext } = await import("@/lib/factory/exec/context");
  const store = await import("@/lib/factory/exec/store");
  const ctx = await makeRunContext(seed, new AbortController().signal);
  const run = await store.getRun(ctx.sql, seed.campaignId);
  if (!run || ["completed", "partial", "failed", "cancelled"].includes(run.status)) return;
  await ctx.emitter.emit({ type: "gap.terminal", payload: { summary: `Run abandoned: ${reason}` } });
  await store.setRunStatus(ctx.sql, seed.campaignId, "failed", { error: reason });
  await ctx.emitter.emit({
    type: "run.failed",
    payload: { summary: "Run failed (workflow error)", detail: { reason } },
  });
  await store.stripRunByok(ctx.sql, seed.campaignId); // dead-letter parity; no-op on house-key runs
}

// ---- The workflow (sandboxed orchestration only) ----------------------------

const ANALYSIS_KEYS: AgentKey[] = [
  "objective_strategist",
  "decision_route",
  "power_stakeholder",
  "pressure_analysis",
];
const PRODUCTION_KEYS: AgentKey[] = [
  "tactics_planner",
  "organising_designer",
  "lobbying_producer",
  "media_producer",
  "digital_producer",
];

export async function campaignWorkflow(seed: CampaignSeed): Promise<{ status?: string }> {
  "use workflow";
  const { reviewerAgentRunId } = await stepInitRun(seed);
  let state = initialState({
    campaignId: seed.campaignId,
    batchId: seed.batchId,
    mode: seed.mode,
    problem: seed.problem,
    place: seed.place,
    reviewerAgentRunId,
  });

  try {
    // Director and specialists start together; the adjudicator joins on both.
    const research = await Promise.all([
      stepResearchDirector(seed, state),
      stepSpecialists(seed, state),
    ]);
    state = applyPatches(state, research);
    state = applyPatch(state, await stepCluster(seed, state, ["evidence_adjudicator"], ["evidence"]));
    state = applyPatch(state, await stepReviewer(seed, state, "evidence", [1, 2]));
    state = applyPatch(
      state,
      await stepCluster(seed, state, ANALYSIS_KEYS, ["objective", "decision_route", "power", "pressure"]),
    );
    state = applyPatch(state, await stepReviewer(seed, state, "analysis", [3, 4, 5, 6]));

    // Strategy + the ONE bounded revision loop (routeAfterStrategy semantics:
    // express never revises; the reviewer only sets needsStrategyRevision
    // within the soft time target and while strategyRevisions < 1).
    state = applyPatch(state, await stepCluster(seed, state, ["strategy_architect"], ["strategy"]));
    state = applyPatch(state, await stepReviewer(seed, state, "strategy", [7]));
    while (seed.profile !== "express" && state.needsStrategyRevision && state.strategyRevisions <= 1) {
      state = applyPatch(state, await stepCluster(seed, state, ["strategy_architect"], ["strategy"]));
      state = applyPatch(state, await stepReviewer(seed, state, "strategy", [7]));
    }

    state = applyPatch(
      state,
      await stepCluster(seed, state, PRODUCTION_KEYS, ["tactics", "organising", "documents"]),
    );
    state = applyPatch(state, await stepReviewer(seed, state, "final", [8, 9, 10]));
    state = applyPatch(state, await stepFinalise(seed, state));
    return { status: state.finalStatus };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await stepFailRun(seed, reason.slice(0, 300));
    throw new FatalError(`campaign run failed: ${reason.slice(0, 300)}`);
  }
}
