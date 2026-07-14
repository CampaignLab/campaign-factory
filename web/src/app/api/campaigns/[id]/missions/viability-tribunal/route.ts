import { after, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { overBudget } from "@/lib/db/spend";
import { getActiveMissionRun } from "@/lib/db/missions";
import { getRunState, isRunOwner } from "@/lib/db/runs";
import { startViabilityTribunal } from "@/lib/missions/viability-tribunal";
import { parseSid } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 800;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (config.readonly) {
    return NextResponse.json({ error: "Mission launches are currently paused. Existing results remain available." }, { status: 503 });
  }

  const sid = parseSid(req.headers.get("cookie"));
  if (!(await isRunOwner(id, sid))) {
    return NextResponse.json({ error: "Only the browser session that created this campaign can launch a mission." }, { status: 403 });
  }
  if (await overBudget()) {
    return NextResponse.json({ error: "Mission capacity has been reached for today. Try again later." }, { status: 503 });
  }

  const campaignRun = await getRunState(id);
  if (!campaignRun) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (!campaignRun.campaign.plan || !campaignRun.campaign.completed.research) {
    return NextResponse.json({ error: "The tribunal needs a completed campaign plan and research snapshot." }, { status: 409 });
  }

  const active = await getActiveMissionRun(id);
  if (active) {
    return NextResponse.json({ error: "A Viability Tribunal is already running.", missionRunId: active.id }, { status: 409 });
  }

  try {
    const { id: missionRunId, work } = await startViabilityTribunal(campaignRun.campaign);
    after(work);
    return NextResponse.json({ missionRunId, status: "queued" }, { status: 202 });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "A Viability Tribunal is already running." }, { status: 409 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "The tribunal could not be launched." }, { status: 500 });
  }
}
