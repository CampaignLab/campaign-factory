import { sql, migrate } from "./client";
import {
  type MissionEvent,
  type MissionResult,
  type MissionRun,
  type MissionRunSummary,
  type MissionStatus,
  type MissionType,
  type MissionWorkerReport,
  type ReviewState,
} from "@/lib/missions/types";
import { parseMissionResult } from "@/lib/missions/schemas";
import { type Campaign } from "@/lib/pipeline/types";
import { mapMissionRunSummaryRow } from "./mission-rows";
import { normalizeMissionResult, normalizeWorkerReport } from "@/lib/missions/validation";

export { mapMissionRunSummaryRow } from "./mission-rows";

const json = (value: unknown) => sql.json(value as Parameters<typeof sql.json>[0]);
const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value));

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

function storedWorkerReports(value: unknown, campaign: Campaign): MissionWorkerReport[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const report = item as Record<string, unknown>;
    const findings = Array.isArray(report.findings) ? report.findings.flatMap((itemFinding) => {
      if (!itemFinding || typeof itemFinding !== "object") return [];
      const finding = itemFinding as Record<string, unknown>;
      const evidenceRefs = Array.isArray(finding.evidenceRefs)
        ? finding.evidenceRefs.filter((ref): ref is string => typeof ref === "string")
        : [];
      const citations = Array.isArray(finding.citations)
        ? finding.citations
        : evidenceRefs.map((id) => ({ id, title: id, organisation: "Campaign evidence register", url: "", date: "", sourceKind: "campaign_source" }));
      return [{
        finding: String(finding.finding || ""),
        basis: finding.basis === "evidence" || finding.basis === "inference" ? finding.basis : "unknown" as const,
        confidence: finding.confidence === "high" || finding.confidence === "medium" ? finding.confidence : "low" as const,
        implication: String(finding.implication || ""),
        citations,
      }];
    }) : [];
    const assessment = report.assessment === "supports_viability" ? "supports"
      : report.assessment === "concern" || report.assessment === "blocking" || report.assessment === "uncertain" || report.assessment === "supports"
        ? report.assessment
        : "uncertain";
    const gaps = [
      ...(Array.isArray(report.gaps) ? report.gaps : []),
      ...(Array.isArray(report.conditions) ? report.conditions : []),
      ...(Array.isArray(report.openQuestions) ? report.openQuestions : []),
    ].filter((gap): gap is string => typeof gap === "string");
    return [normalizeWorkerReport({
      agentKey: String(report.agentKey || "unknown"),
      agentName: String(report.agentName || "Specialist"),
      assessment,
      summary: String(report.summary || ""),
      findings: findings as MissionWorkerReport["findings"],
      gaps,
    }, campaign)];
  });
}

export async function createMissionRun(args: {
  id: string;
  campaignId: string;
  campaign: Campaign;
  missionType: MissionType;
  snapshotHash: string;
}): Promise<void> {
  await migrate();
  await sql`
    insert into mission_runs (id, campaign_id, mission_type, status, campaign_snapshot, snapshot_hash)
    values (${args.id}, ${args.campaignId}, ${args.missionType}, 'queued', ${json(args.campaign)}, ${args.snapshotHash})
  `;
}

export async function setMissionStatus(id: string, status: MissionStatus): Promise<void> {
  await migrate();
  await sql`update mission_runs set status = ${status}, updated_at = now() where id = ${id}`;
}

export async function saveWorkerReports(id: string, reports: MissionWorkerReport[]): Promise<void> {
  await migrate();
  await sql`update mission_runs set worker_reports = ${json(reports)}, updated_at = now() where id = ${id}`;
}

export async function completeMissionRun(args: {
  id: string;
  status: "complete" | "partial";
  reports: MissionWorkerReport[];
  result: MissionResult;
  costUSD: number;
}): Promise<void> {
  await migrate();
  const validated = parseMissionResult(args.result.missionType, args.result);
  await sql`
    update mission_runs set
      status = ${args.status},
      worker_reports = ${json(args.reports)},
      result = ${json(validated)},
      cost_usd = ${args.costUSD},
      error = null,
      updated_at = now(),
      completed_at = now()
    where id = ${args.id}
  `;
}

export async function failMissionRun(id: string, error: string, reports: MissionWorkerReport[], costUSD: number): Promise<void> {
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
  return rows.map((row) => mapMissionRunSummaryRow(row as Record<string, unknown>));
}

export async function getMissionRun(id: string): Promise<MissionRun | null> {
  await migrate();
  const rows = await sql`
    select id, campaign_id, mission_type, status, campaign_snapshot, snapshot_hash, worker_reports, result,
      error, cost_usd, review_state, created_at, updated_at, completed_at
    from mission_runs where id = ${id}
  `;
  if (!rows[0]) return null;
  const row = rows[0] as Record<string, unknown>;
  const campaignSnapshot = row.campaign_snapshot as Campaign;
  const summary = mapMissionRunSummaryRow(row);
  const eventRows = await sql`
    select id, mission_run_id, kind, agent_key, label, detail, created_at
    from mission_events where mission_run_id = ${id} order by id
  `;
  return {
    ...summary,
    snapshotHash: row.snapshot_hash as string,
    campaignSnapshot,
    workerReports: storedWorkerReports(row.worker_reports, campaignSnapshot),
    result: summary.result ? normalizeMissionResult(summary.result, campaignSnapshot) : undefined,
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
    where campaign_id = ${campaignId} and status in ('queued', 'running')
    order by created_at desc limit 1
  `;
  return rows[0] ? mapMissionRunSummaryRow(rows[0] as Record<string, unknown>) : null;
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
