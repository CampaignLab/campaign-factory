// Public surface of the W3 agent runtime, for W2's graph to import from one
// place. executeAgentTurn drives the 12 non-reviewer fixed agents + 6
// specialists; runSynthesisReview drives the recurring reviewer node.

export { executeAgentTurn } from "./executor";
export { runSynthesisReview, type ReviewInput, type ReviewOutcome, type ReviewPass } from "./reviewer";
export { runInvisibleQA, deterministicQA, type QAFlag, type QAInput, type QAKind } from "./qa";
export { buildTools, fetchPage, isBlockedIp, tierOf, FETCH_PAGE_TOOL } from "./gateway";
export { WorkEmitter } from "./work";
export {
  type AgentTurnFn,
  type ExecutorDeps,
  type EmitFragment,
  type Emit,
  type Gate,
  type GateAcquireInput,
  type GateRelease,
  type RecordUsage,
  type RecordUsageInput,
} from "./deps";
