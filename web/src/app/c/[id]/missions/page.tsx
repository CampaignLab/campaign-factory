import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { MissionBay } from "@/components/mission-bay/MissionBay";
import { getMissionRun, listMissionRuns } from "@/lib/db/missions";
import { getRunState, isRunOwner } from "@/lib/db/runs";
import { getMissionBySlug, RUNNABLE_MISSIONS } from "@/lib/missions/catalogue";
import { type MissionRun, type MissionType } from "@/lib/missions/types";
import { parseSid } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mission Bay | Campaign Factory",
  description: "Challenge, investigate, watch and prepare a campaign with bounded agent missions.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function MissionBayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mission?: string | string[]; run?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const campaignRun = await getRunState(id);
  if (!campaignRun) notFound();

  const cookieStore = await cookies();
  const sid = parseSid(cookieStore.toString());
  const [canLaunch, runs] = await Promise.all([isRunOwner(id, sid), listMissionRuns(id)]);
  const requestedSlug = typeof query.mission === "string" ? query.mission : undefined;
  const requestedId = typeof query.run === "string" ? query.run : undefined;
  const requestedMission = requestedSlug ? getMissionBySlug(requestedSlug) : undefined;
  const requestedRun = requestedId && UUID.test(requestedId) ? await getMissionRun(requestedId) : null;
  const validRequestedRun = requestedRun?.campaignId === id
    && (!requestedMission || requestedRun.missionType === requestedMission.type)
    ? requestedRun
    : null;
  const initialMissionType: MissionType = requestedMission?.type || validRequestedRun?.missionType || "viability_tribunal";
  const latestByType = new Map<MissionType, string>();
  for (const run of runs) if (!latestByType.has(run.missionType)) latestByType.set(run.missionType, run.id);
  const initialRuns = await Promise.all(RUNNABLE_MISSIONS.map(async (mission) => {
    const runId = latestByType.get(mission.type);
    return runId ? getMissionRun(runId) : null;
  }));
  const initialRunByType = Object.fromEntries(
    initialRuns.filter((run): run is MissionRun => Boolean(run)).map((run) => [run.missionType, run]),
  ) as Partial<Record<MissionType, MissionRun>>;
  if (validRequestedRun) initialRunByType[validRequestedRun.missionType] = validRequestedRun;

  return (
    <main className="mission-bay-page">
      <MissionBay
        campaign={campaignRun.campaign}
        canLaunch={canLaunch}
        initialRuns={runs}
        initialRunByType={initialRunByType}
        initialMissionType={initialMissionType}
      />
    </main>
  );
}
