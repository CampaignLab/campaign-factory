// Campaign run state for the Workflow executor — the exact channels of the
// worker's LangGraph state (worker/src/graph/state.ts), as a plain
// JSON-serialisable object owned by the workflow function. applyPatch
// replicates the channel reducers: pendingProposals appends (or clears via the
// "clear" sentinel), acceptedSteps set-unions, terminalGaps appends, everything
// else replaces. Workflow step results ARE the checkpoints, so no reducer may
// depend on process state.

import type { ChangeProposal } from "@/lib/factory/contracts/state";
import type { SpecialistKey } from "@/lib/factory/contracts/roster";
import type { RunStatus } from "@/lib/factory/contracts/core";

export interface PendingProposal {
  proposal: ChangeProposal;
  agentKey: string;
  qaFlags?: string[];
}

export interface RunState {
  campaignId: string;
  batchId?: string;
  mode: "public" | "presenter";
  problem: string;
  place: string;
  stateVersion: number;
  selectedSpecialists: SpecialistKey[];
  pendingProposals: PendingProposal[];
  acceptedSteps: string[];
  strategyRevisions: number;
  needsStrategyRevision: boolean;
  reviewerAgentRunId: string;
  halted: boolean;
  haltReason?: string;
  terminalGaps: string[];
  finalStatus?: RunStatus;
}

// A node's update: same shape the LangGraph nodes returned.
export interface Patch {
  campaignId?: string;
  batchId?: string;
  mode?: "public" | "presenter";
  problem?: string;
  place?: string;
  stateVersion?: number;
  selectedSpecialists?: SpecialistKey[];
  pendingProposals?: PendingProposal[] | "clear";
  acceptedSteps?: string[];
  strategyRevisions?: number;
  needsStrategyRevision?: boolean;
  reviewerAgentRunId?: string;
  halted?: boolean;
  haltReason?: string;
  terminalGaps?: string[];
  finalStatus?: RunStatus;
}

export function initialState(seed: {
  campaignId: string;
  batchId?: string;
  mode: "public" | "presenter";
  problem: string;
  place: string;
  reviewerAgentRunId: string;
}): RunState {
  return {
    ...seed,
    stateVersion: 0,
    selectedSpecialists: [],
    pendingProposals: [],
    acceptedSteps: [],
    strategyRevisions: 0,
    needsStrategyRevision: false,
    halted: false,
    terminalGaps: [],
  };
}

export function applyPatch(state: RunState, patch: Patch): RunState {
  const next: RunState = { ...state };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (key === "pendingProposals") {
      next.pendingProposals =
        value === "clear" ? [] : [...next.pendingProposals, ...(value as PendingProposal[])];
    } else if (key === "acceptedSteps") {
      next.acceptedSteps = Array.from(new Set([...next.acceptedSteps, ...(value as string[])]));
    } else if (key === "terminalGaps") {
      next.terminalGaps = [...next.terminalGaps, ...(value as string[])];
    } else {
      (next as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

/** Apply the patches of one parallel superstep (e.g. director ‖ specialists) —
 * order-independent for append channels, mirroring LangGraph's superstep merge. */
export function applyPatches(state: RunState, patches: Patch[]): RunState {
  return patches.reduce(applyPatch, state);
}
