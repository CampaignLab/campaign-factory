// Resolves the agent-brain functions for the Workflow executor — the web
// counterpart of worker/src/graph/executor-loader.ts, minus its dynamic-import
// fallbacks: under the web bundler the agent modules are always statically
// present (they live in ./agents), so a missing module is a build error, which
// is strictly stronger than the worker's C2 fail-loud runtime check. Mock mode
// is handled INSIDE the executor/reviewer (deps.modelMode), not here.

import type { AgentTurnFn } from "./agents/deps";
import { executeAgentTurn } from "./agents/executor";
import { runSynthesisReview } from "./agents/reviewer";
import { runInvisibleQA } from "./agents/qa";
import type { ReviewFn, QAFn, ReviewOutcome } from "./review-contract";

export type { ModelMode } from "@/lib/factory/contracts/api";

export interface RuntimeAgents {
  executeAgentTurn: AgentTurnFn;
  review: ReviewFn;
  runQA: QAFn;
}

// Adapt w3's reviewer output ({reviews, workSummary}) to the graph-local
// contract ({reviews, passStepReport}) — same mapping the worker loader did.
const review: ReviewFn = async (input, deps): Promise<ReviewOutcome> => {
  const out = await runSynthesisReview(input, deps);
  const reviews = Array.isArray(out?.reviews)
    ? out.reviews.map((r) => ({
        proposalId: r.proposalId,
        decision: r.decision,
        rationale: r.rationale ?? "",
        stepReport: r.stepReport,
      }))
    : input.proposals.map((p) => ({
        proposalId: p.id,
        decision: "return" as const,
        rationale: "reviewer omitted a decision",
      }));
  return { reviews, passStepReport: out?.workSummary };
};

const runQA: QAFn = async (input, deps) => {
  const flags = await runInvisibleQA(input, deps);
  return Array.isArray(flags)
    ? flags.map((f) =>
        typeof f === "string"
          ? f
          : ((f as { message?: string; code?: string })?.message ??
            (f as { code?: string })?.code ??
            JSON.stringify(f)),
      )
    : [];
};

export async function loadRuntimeAgents(): Promise<RuntimeAgents> {
  return { executeAgentTurn, review, runQA };
}
