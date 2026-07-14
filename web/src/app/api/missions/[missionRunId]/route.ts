import { NextResponse } from "next/server";
import { getMissionRun } from "@/lib/db/missions";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ missionRunId: string }> }) {
  const { missionRunId } = await ctx.params;
  const run = await getMissionRun(missionRunId);
  if (!run) return NextResponse.json({ error: "Mission run not found" }, { status: 404 });
  return NextResponse.json(run);
}
