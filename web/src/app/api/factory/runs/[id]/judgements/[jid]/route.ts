// POST /api/factory/runs/[id]/judgements/[jid] — thin signed proxy. Body is a
// JudgementAnswerRequest { action: "answer"|"defer"|"accept_default", answer? }.
// Nonblocking: the worker records the answer and emits judgement.resolved.

import { NextResponse } from "next/server";
import { forwardSigned } from "../../../../_lib/worker";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string; jid: string }> }) {
  const { id, jid } = await ctx.params;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const r = await forwardSigned("POST", `/runs/${id}/judgements/${jid}`, body);
  return NextResponse.json(r.body, { status: r.status });
}
