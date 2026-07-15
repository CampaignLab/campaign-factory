// POST /api/factory/runs/[id]/cancel — thin signed proxy to the worker. The
// worker marks the run cancelled + aborts in-flight work; its finalise node is
// the single writer of run.cancelled.

import { NextResponse } from "next/server";
import { forwardSigned } from "../../../_lib/worker";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await forwardSigned("POST", `/runs/${id}/cancel`);
  return NextResponse.json(r.body, { status: r.status });
}
