// Trigger + observe the Vercel Workflow migration spike (src/workflows/spike.ts).
// POST {question} → { runId }; GET ?runId=… → the run's stream (NDJSON chunks).
// Both gated by x-spike-secret === WORKFLOW_SPIKE_SECRET (unset = route dead) —
// this endpoint spends real model budget, so it must never be publicly callable.

import { NextResponse } from "next/server";
import { start, getRun } from "workflow/api";
import { spikeWorkflow } from "@/workflows/spike";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = (process.env.WORKFLOW_SPIKE_SECRET || "").trim();
  return !!secret && (req.headers.get("x-spike-secret") || "").trim() === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { question?: unknown };
  const question =
    typeof b.question === "string" && b.question.trim()
      ? b.question.trim().slice(0, 500)
      : "Who currently leads Leicester City Council, and when is the next full council meeting?";
  const run = await start(spikeWorkflow, [question]);
  return NextResponse.json({ runId: run.runId });
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const runId = new URL(req.url).searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });
  const run = getRun(runId);
  const ndjson = run.getReadable<object>().pipeThrough(
    new TransformStream<object, string>({
      transform(chunk, controller) {
        controller.enqueue(`${JSON.stringify(chunk)}\n`);
      },
    }),
  );
  return new Response(ndjson.pipeThrough(new TextEncoderStream()), {
    headers: { "content-type": "application/x-ndjson" },
  });
}
