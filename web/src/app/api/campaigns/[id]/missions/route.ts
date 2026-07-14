import { NextResponse } from "next/server";
import { getRunState, isRunOwner } from "@/lib/db/runs";
import { listMissionRuns } from "@/lib/db/missions";
import { parseSid } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaign = await getRunState(id);
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  const sid = parseSid(req.headers.get("cookie"));
  const [runs, canLaunch] = await Promise.all([listMissionRuns(id), isRunOwner(id, sid)]);
  return NextResponse.json({ runs, canLaunch });
}
