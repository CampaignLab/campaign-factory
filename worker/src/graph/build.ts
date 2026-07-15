// Campaign graph topology (parameters §4). Checkpoint after every completed
// node (PostgresSaver, thread_id = campaignId) so a worker restart resumes each
// campaign from its last checkpoint.
//
//   research_director
//     → specialists (2 selected, parallel)
//     → evidence_adjudicator
//     → reviewer(evidence)                 [acceptance pass after research cluster]
//     → analysis (objective ‖ decision_route ‖ power ‖ pressure)
//     → reviewer(analysis)                 [acceptance pass after analysis cluster]
//     → strategy_architect
//     → reviewer(strategy)  ──return?──▶ strategy_architect   (ONE bounded loop)
//     → planning (tactics ‖ organising)
//     → production (lobbying ‖ media ‖ digital)
//     → reviewer(final)
//     → finalise (deterministic: compile documents + receipt + terminal status)
//
// Clusters are single graph nodes that fan their agents out with Promise.all
// (real concurrent, gated model calls) — this keeps state writes serial and
// gives one checkpoint per cluster boundary.

import { StateGraph, START, END } from "@langchain/langgraph";
import type { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { GraphState, type GraphStateType } from "./state.js";
import {
  researchDirectorNode,
  specialistsClusterNode,
  agentClusterNode,
  reviewerNode,
} from "./nodes.js";
import { finaliseNode } from "./finalise.js";

export function buildCampaignGraph(checkpointer: PostgresSaver) {
  const graph = new StateGraph(GraphState)
    .addNode("research_director", researchDirectorNode())
    .addNode("specialists", specialistsClusterNode())
    .addNode("evidence_adjudicator", agentClusterNode(["evidence_adjudicator"], ["evidence"]))
    .addNode("reviewer_evidence", reviewerNode("evidence", [1, 2]))
    .addNode(
      "analysis",
      agentClusterNode(
        ["objective_strategist", "decision_route", "power_stakeholder", "pressure_analysis"],
        ["objective", "decision_route", "power", "pressure"],
      ),
    )
    .addNode("reviewer_analysis", reviewerNode("analysis", [3, 4, 5, 6]))
    .addNode("strategy_architect", agentClusterNode(["strategy_architect"], ["strategy"]))
    .addNode("reviewer_strategy", reviewerNode("strategy", [7]))
    .addNode("planning", agentClusterNode(["tactics_planner", "organising_designer"], ["tactics", "organising"]))
    .addNode(
      "production",
      agentClusterNode(["lobbying_producer", "media_producer", "digital_producer"], ["documents"]),
    )
    .addNode("reviewer_final", reviewerNode("final", [8, 9, 10]))
    .addNode("finalise", finaliseNode())
    .addEdge(START, "research_director")
    .addEdge("research_director", "specialists")
    .addEdge("specialists", "evidence_adjudicator")
    .addEdge("evidence_adjudicator", "reviewer_evidence")
    .addEdge("reviewer_evidence", "analysis")
    .addEdge("analysis", "reviewer_analysis")
    .addEdge("reviewer_analysis", "strategy_architect")
    .addEdge("strategy_architect", "reviewer_strategy")
    .addConditionalEdges("reviewer_strategy", routeAfterStrategy, {
      revise: "strategy_architect",
      proceed: "planning",
    })
    .addEdge("planning", "production")
    .addEdge("production", "reviewer_final")
    .addEdge("reviewer_final", "finalise")
    .addEdge("finalise", END);

  return graph.compile({ checkpointer });
}

// ONE bounded revision loop: return to strategy only if the strategy reviewer
// asked for a revision and we have not already revised once.
function routeAfterStrategy(state: GraphStateType): "revise" | "proceed" {
  return state.needsStrategyRevision && state.strategyRevisions <= 1 ? "revise" : "proceed";
}
