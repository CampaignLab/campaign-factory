// RuntimeContext: the non-serialisable per-run dependencies passed to graph
// nodes via config.configurable (NOT checkpointed). On resume after a restart,
// run.ts rebuilds a fresh context; state comes from the checkpoint.

import type { RunnableConfig } from "@langchain/core/runnables";
import type { Sql } from "../db/pool.js";
import type { Emitter } from "../events/emit.js";
import type { Gate, RecordUsage, AgentTurnFn } from "../agents/deps.js";
import type { ModelMode } from "../config.js";
import type { ReviewFn, QAFn } from "./review-contract.js";

export interface RuntimeContext {
  sql: Sql;
  emitter: Emitter;
  gate: Gate;
  recordUsage: RecordUsage;
  modelMode: ModelMode;
  mode: "public" | "presenter";
  batchId?: string;
  signal: AbortSignal;
  apiKey?: string;
  executeAgentTurn: AgentTurnFn;
  review: ReviewFn;
  runQA: QAFn;
}

const KEY = "factoryContext";

export function withContext(ctx: RuntimeContext): RunnableConfig {
  return { configurable: { [KEY]: ctx }, recursionLimit: 100 };
}

export function contextFrom(config: RunnableConfig | undefined): RuntimeContext {
  const ctx = config?.configurable?.[KEY] as RuntimeContext | undefined;
  if (!ctx) throw new Error("RuntimeContext missing from graph config.configurable");
  return ctx;
}
