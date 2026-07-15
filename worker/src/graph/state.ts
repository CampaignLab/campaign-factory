// LangGraph state channels for one campaign. Kept lean + JSON-serialisable so
// PostgresSaver can checkpoint it after every node (thread_id = campaignId).
// Non-serialisable runtime deps (sql, gate, emitter, executor…) live in the
// RuntimeContext passed via config.configurable — never in state.

import { Annotation } from "@langchain/langgraph";
import type { ChangeProposal } from "@web/lib/factory/contracts/state.js";
import type { SpecialistKey } from "@web/lib/factory/contracts/roster.js";
import type { RunStatus } from "@web/lib/factory/contracts/core.js";

// A proposal awaiting the next reviewer pass (with the author's key for events
// and any invisible-QA flags to feed the reviewer).
export interface PendingProposal {
  proposal: ChangeProposal;
  agentKey: string;
  qaFlags?: string[];
}

const replace = <T,>(_a: T, b: T): T => b;

export const GraphState = Annotation.Root({
  campaignId: Annotation<string>(),
  batchId: Annotation<string | undefined>({ reducer: replace, default: () => undefined }),
  mode: Annotation<"public" | "presenter">({ reducer: replace, default: () => "public" }),
  problem: Annotation<string>({ reducer: replace, default: () => "" }),
  place: Annotation<string>({ reducer: replace, default: () => "" }),

  stateVersion: Annotation<number>({ reducer: replace, default: () => 0 }),
  selectedSpecialists: Annotation<SpecialistKey[]>({ reducer: replace, default: () => [] }),

  // Proposals from the most recent cluster, consumed + cleared by the reviewer.
  pendingProposals: Annotation<PendingProposal[]>({ reducer: replace, default: () => [] }),

  acceptedSteps: Annotation<string[]>({
    reducer: (a, b) => Array.from(new Set([...(a ?? []), ...(b ?? [])])),
    default: () => [],
  }),
  strategyRevisions: Annotation<number>({ reducer: replace, default: () => 0 }),
  needsStrategyRevision: Annotation<boolean>({ reducer: replace, default: () => false }),
  reviewerAgentRunId: Annotation<string>({ reducer: replace, default: () => "" }),

  // Halt = cancelled or cost hard-stop. Remaining model nodes become no-ops;
  // finalisation still runs and records skipped work as Terminal Gaps.
  halted: Annotation<boolean>({ reducer: replace, default: () => false }),
  haltReason: Annotation<string | undefined>({ reducer: replace, default: () => undefined }),
  terminalGaps: Annotation<string[]>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
    default: () => [],
  }),
  finalStatus: Annotation<RunStatus | undefined>({ reducer: replace, default: () => undefined }),
});

export type GraphStateType = typeof GraphState.State;
