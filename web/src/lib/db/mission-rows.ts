import { isMissionType, parseStoredMissionResult } from "@/lib/missions/schemas";
import { type MissionRunSummary, type MissionStatus, type ReviewState } from "@/lib/missions/types";

export const ACTIVE_MISSION_STATUSES: readonly MissionStatus[] = ["queued", "running"];

export function isActiveMissionStatus(status: MissionStatus): boolean {
  return ACTIVE_MISSION_STATUSES.includes(status);
}

export function campaignHasActiveMission(runs: Pick<MissionRunSummary, "status">[]): boolean {
  return runs.some((run) => isActiveMissionStatus(run.status));
}

const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value));

export function mapMissionRunSummaryRow(row: Record<string, unknown>): MissionRunSummary {
  if (!isMissionType(row.mission_type)) throw new Error(`Unknown mission type in database: ${String(row.mission_type)}`);
  const missionType = row.mission_type;
  return {
    id: row.id as string,
    campaignId: row.campaign_id as string,
    missionType,
    status: row.status as MissionStatus,
    result: row.result ? parseStoredMissionResult(missionType, row.result) : undefined,
    error: (row.error || undefined) as string | undefined,
    reviewState: row.review_state as ReviewState,
    createdAt: iso(row.created_at),
    completedAt: row.completed_at ? iso(row.completed_at) : undefined,
  };
}
