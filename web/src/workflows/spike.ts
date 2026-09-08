// Vercel Workflow migration SPIKE (8 Sep 2026, docs/product/vercel-workflow-migration.md).
// Proves the load-bearing unknowns of moving the Railway worker onto Vercel
// Workflow, using ONE realistic agent call: the house call() helper (streaming,
// prompt caching, pause_turn resumes) with the real web_search server tool,
// running inside a "use step" function, with live progress on the run's stream.
// Not wired into any product path — started only by /api/workflow-spike, which
// is gated by WORKFLOW_SPIKE_SECRET.

import { getWritable } from "workflow";

export interface SpikeChunk {
  kind: "note" | "text" | "thinking" | "phase" | "report";
  text: string;
  atMs: number; // elapsed since step start
}

export interface SpikeReport {
  ok: boolean;
  model: string;
  durationMs: number;
  searches: number;
  inputTokens: number;
  outputTokens: number;
  textPreview: string;
}

// Emit one chunk onto the run's default stream. Steps have full stream access;
// the workflow function itself must not touch the writer (sandbox rule).
async function emit(chunk: SpikeChunk): Promise<void> {
  "use step";
  const writer = getWritable<SpikeChunk>().getWriter();
  try {
    await writer.write(chunk);
  } finally {
    writer.releaseLock();
  }
}

// The realistic agent call. Full Node access here, so the existing model layer
// is reused untouched — exactly what a migrated factory agent would do.
async function researchProbe(question: string): Promise<SpikeReport> {
  "use step";
  const { getClient, call, textOf } = await import("@/lib/anthropic");
  const t0 = Date.now();
  const writer = getWritable<SpikeChunk>().getWriter();
  const at = () => Date.now() - t0;
  let searches = 0;
  try {
    const client = getClient(); // house key from env — same resolution as the pipeline
    const msg = await call(
      client,
      {
        model: "claude-sonnet-5",
        max_tokens: 1500,
        system:
          "You are a local-government research agent. Answer with 2-3 verified facts, each with its source URL. Be brief.",
        messages: [{ role: "user", content: question }],
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 2 }],
        effort: "low",
      },
      {
        onToolNote: (note) => {
          searches += 1;
          void writer.write({ kind: "note", text: note, atMs: at() });
        },
        onProgress: (kind, delta) => void writer.write({ kind, text: delta, atMs: at() }),
      },
    );
    const text = textOf(msg);
    const usage = msg.usage as { input_tokens?: number; output_tokens?: number };
    return {
      ok: true,
      model: "claude-sonnet-5",
      durationMs: Date.now() - t0,
      searches,
      inputTokens: usage.input_tokens ?? 0,
      outputTokens: usage.output_tokens ?? 0,
      textPreview: text.slice(0, 500),
    };
  } finally {
    writer.releaseLock();
  }
}

export async function spikeWorkflow(question: string): Promise<SpikeReport> {
  "use workflow";
  await emit({ kind: "phase", text: "research step starting", atMs: 0 });
  const report = await researchProbe(question);
  await emit({ kind: "report", text: JSON.stringify(report), atMs: report.durationMs });
  return report;
}
