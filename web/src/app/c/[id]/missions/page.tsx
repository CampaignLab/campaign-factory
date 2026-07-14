import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { MissionBay } from "@/components/mission-bay/MissionBay";
import { getMissionRun, listMissionRuns } from "@/lib/db/missions";
import { getRunState, isRunOwner } from "@/lib/db/runs";
import { parseSid } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mission Bay | Campaign Factory",
  description: "Challenge, investigate, watch and prepare a campaign with bounded agent missions.",
};

export default async function MissionBayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaignRun = await getRunState(id);
  if (!campaignRun) notFound();

  const cookieStore = await cookies();
  const sid = parseSid(cookieStore.toString());
  const [canLaunch, runs] = await Promise.all([isRunOwner(id, sid), listMissionRuns(id)]);
  const initialRun = runs[0] ? await getMissionRun(runs[0].id) : null;

  return (
    <main className="mission-bay-page">
      <MissionBay
        campaign={campaignRun.campaign}
        canLaunch={canLaunch}
        initialRuns={runs}
        initialRun={initialRun}
      />
    </main>
  );
}
