import { sql, migrate } from "./client";
import {
  type MissionEvent,
  type MissionRun,
  type MissionRunSummary,
  type MissionStatus,
  type ReviewState,
  type ViabilityTribunalResult,
  type WorkerReport,
} from "@/lib/missions/types";
import { type Campaign } from "@/lib/pipeline/types";

const json = (value: unknown) => sql.json(value as Parameters<typeof sql.json>[0]);
const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value));

function rowToSummary(row: Record<string, unknown>): MissionRunSummary {
  return {
    id: row.id as string,
    campaignId: row.campaign_id as string,
    missionType: "viability_tribunal",
    status: row.status as MissionStatus,
    result: (row.result || undefined) as ViabilityTribunalResult | undefined,
    error: (row.error || undefined) as string | undefined,
    reviewState: row.review_state as ReviewState,
    createdAt: iso(row.created_at),
    completedAt: row.completed_at ? iso(row.completed_at) : undefined,
  };
}

function rowToEvent(row: Record<string, unknown>): MissionEvent {
  return {
    id: Number(row.id),
    missionRunId: row.mission_run_id as string,
    kind: row.kind as string,
    agentKey: (row.agent_key || undefined) as string | undefined,
    label: row.label as string,
    detail: (row.detail || undefined) as string | undefined,
    createdAt: iso(row.created_at),
  };
}

export async function createMissionRun(args: {
  id: string;
  campaignId: string;
  campaign: Campaign;
  snapshotHash: string;
}): Promise<void> {
  await migrate();
  await sql`
    insert into mission_runs (id, campaign_id, mission_type, status, campaign_snapshot, snapshot_hash)
    values (${args.id}, ${args.campaignId}, 'viability_tribunal', 'queued', ${json(args.campaign)}, ${args.snapshotHash})
  `;
}

export async function setMissionStatus(id: string, status: MissionStatus): Promise<void> {
  await migrate();
  await sql`update mission_runs set status = ${status}, updated_at = now() where id = ${id}`;
}

export async function saveWorkerReports(id: string, reports: WorkerReport[]): Promise<void> {
  await migrate();
  await sql`update mission_runs set worker_reports = ${json(reports)}, updated_at = now() where id = ${id}`;
}

export async function completeMissionRun(args: {
  id: string;
  status: "complete" | "partial";
  reports: WorkerReport[];
  result: ViabilityTribunalResult;
  costUSD: number;
}): Promise<void> {
  await migrate();
  await sql`
    update mission_runs set
      status = ${args.status},
      worker_reports = ${json(args.reports)},
      result = ${json(args.result)},
      cost_usd = ${args.costUSD},
      error = null,
      updated_at = now(),
      completed_at = now()
    where id = ${args.id}
  `;
}

export async function failMissionRun(id: string, error: string, reports: WorkerReport[], costUSD: number): Promise<void> {
  await migrate();
  await sql`
    update mission_runs set
      status = 'failed',
      worker_reports = ${json(reports)},
      error = ${error},
      cost_usd = ${costUSD},
      updated_at = now(),
      completed_at = now()
    where id = ${id}
  `;
}

export async function appendMissionEvent(args: {
  missionRunId: string;
  kind: string;
  label: string;
  agentKey?: string;
  detail?: string;
}): Promise<void> {
  await migrate();
  await sql`
    insert into mission_events (mission_run_id, kind, agent_key, label, detail)
    values (${args.missionRunId}, ${args.kind}, ${args.agentKey || null}, ${args.label}, ${args.detail || null})
  `;
}

export async function listMissionRuns(campaignId: string): Promise<MissionRunSummary[]> {
  await migrate();
  const rows = await sql`
    select id, campaign_id, mission_type, status, result, error, review_state, created_at, completed_at
    from mission_runs where campaign_id = ${campaignId}
    order by created_at desc
  `;
  return rows.map((row) => rowToSummary(row as Record<string, unknown>));
}

export async function getMissionRun(id: string): Promise<MissionRun | null> {
  await migrate();
  const rows = await sql`
    select id, campaign_id, mission_type, status, snapshot_hash, worker_reports, result,
      error, cost_usd, review_state, created_at, updated_at, completed_at
    from mission_runs where id = ${id}
  `;
  if (!rows[0]) return null;
  const row = rows[0] as Record<string, unknown>;
  const eventRows = await sql`
    select id, mission_run_id, kind, agent_key, label, detail, created_at
    from mission_events where mission_run_id = ${id} order by id
  `;
  return {
    ...rowToSummary(row),
    snapshotHash: row.snapshot_hash as string,
    workerReports: (row.worker_reports || []) as WorkerReport[],
    costUSD: Number(row.cost_usd),
    updatedAt: iso(row.updated_at),
    events: eventRows.map((event) => rowToEvent(event as Record<string, unknown>)),
  };
}

export async function getActiveMissionRun(campaignId: string): Promise<MissionRunSummary | null> {
  await migrate();
  const rows = await sql`
    select id, campaign_id, mission_type, status, result, error, review_state, created_at, completed_at
    from mission_runs
    where campaign_id = ${campaignId} and mission_type = 'viability_tribunal' and status in ('queued', 'running')
    order by created_at desc limit 1
  `;
  return rows[0] ? rowToSummary(rows[0] as Record<string, unknown>) : null;
}

export async function reviewMissionRun(id: string, sid: string, reviewState: Exclude<ReviewState, "unreviewed">): Promise<boolean> {
  await migrate();
  const rows = await sql`
    update mission_runs mission set review_state = ${reviewState}, updated_at = now()
    from runs campaign
    where mission.id = ${id}
      and campaign.id = mission.campaign_id
      and campaign.owner_sid = ${sid}
      and mission.status in ('complete', 'partial')
    returning mission.id
  `;
  return Boolean(rows[0]);
}
