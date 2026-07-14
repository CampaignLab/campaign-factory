import { after, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getActiveMissionRun } from "@/lib/db/missions";
import { getRunState, isRunOwner } from "@/lib/db/runs";
import { overBudget } from "@/lib/db/spend";
import { getMissionByType } from "@/lib/missions/catalogue";
import { startMission } from "@/lib/missions/orchestrator";
import { getMissionSpecificationBySlug } from "@/lib/missions/registry";
import { parseSid } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 800;

export async function POST(req: Request, ctx: { params: Promise<{ id: string; missionSlug: string }> }) {
  const { id, missionSlug } = await ctx.params;
  const specification = getMissionSpecificationBySlug(missionSlug);
  if (!specification) return NextResponse.json({ error: "Unknown or unavailable mission." }, { status: 404 });

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
  const missing = specification.readiness(campaignRun.campaign);
  if (missing.length) {
    return NextResponse.json({ error: `This mission needs ${missing.join(" and ")}.` }, { status: 409 });
  }

  const active = await getActiveMissionRun(id);
  if (active) {
    return NextResponse.json({
      error: `${getMissionByType(active.missionType).name} is already active. Only one mission can run for a campaign at a time.`,
      missionRunId: active.id,
      missionType: active.missionType,
    }, { status: 409 });
  }

  try {
    const { id: missionRunId, work } = await startMission(campaignRun.campaign, specification);
    after(() => work);
    return NextResponse.json({ missionRunId, missionType: specification.type, status: "queued" }, { status: 202 });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "23505") {
      const concurrent = await getActiveMissionRun(id);
      return NextResponse.json({
        error: "Another mission became active first. Only one mission can run for a campaign at a time.",
        missionRunId: concurrent?.id,
        missionType: concurrent?.missionType,
      }, { status: 409 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "The mission could not be launched." }, { status: 500 });
  }
}
