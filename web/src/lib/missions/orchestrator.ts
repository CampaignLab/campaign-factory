import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { createHash, randomUUID } from "node:crypto";
import { call, getClient, parseJSONLoose, textOf } from "@/lib/anthropic";
import { addSpend } from "@/lib/db/spend";
import {
  appendMissionEvent,
  completeMissionRun,
  createMissionRun,
  failMissionRun,
  saveWorkerReports,
  setMissionStatus,
} from "@/lib/db/missions";
import { type Campaign } from "@/lib/pipeline/types";
import { costUSD, type UsageSink } from "@/lib/spend/pricing";
import { type MissionSpecification } from "./registry";
import { type MissionResult, type MissionWorkerReport } from "./types";
import { normalizeWorkerReport } from "./validation";
import { validateSynthesis, workerOutcomeStatus } from "./runtime-validation";

const WORKER_MODEL = "claude-sonnet-5";
const SYNTHESIS_MODEL = "claude-sonnet-5";
const WEB_SEARCH_TOOL = { type: "web_search_20260209", name: "web_search", max_uses: 5 };

async function runWorker(args: {
  client: Anthropic;
  missionRunId: string;
  specification: MissionSpecification;
  worker: MissionSpecification["agents"][number];
  campaign: Campaign;
  prepared: unknown;
  onUsage: UsageSink;
}): Promise<MissionWorkerReport | null> {
  await appendMissionEvent({
    missionRunId: args.missionRunId,
    kind: "agent_started",
    agentKey: args.worker.key,
    label: `${args.worker.name} started`,
    detail: args.worker.brief,
  });
  try {
    const message = await call(
      args.client,
      {
        model: WORKER_MODEL,
        max_tokens: 6_000,
        system: args.specification.workerSystem,
        effort: "medium",
        adaptiveThinking: true,
        jsonSchema: args.specification.workerJsonSchema,
        tools: args.specification.usesWebSearch ? [WEB_SEARCH_TOOL] : undefined,
        messages: [{
          role: "user",
          content: `${args.worker.brief}\n\nMISSION INPUT\n${JSON.stringify(args.prepared)}`,
        }],
      },
      { maxPauseResumes: 3, onUsage: args.onUsage },
    );
    const parsed = args.specification.workerSchema.parse(parseJSONLoose(textOf(message)));
    const report = normalizeWorkerReport({ ...parsed, agentKey: args.worker.key, agentName: args.worker.name }, args.campaign);
    await appendMissionEvent({
      missionRunId: args.missionRunId,
      kind: "agent_completed",
      agentKey: args.worker.key,
      label: `${args.worker.name} reported`,
      detail: report.summary,
    });
    return report;
  } catch (error) {
    await appendMissionEvent({
      missionRunId: args.missionRunId,
      kind: "agent_failed",
      agentKey: args.worker.key,
      label: `${args.worker.name} could not complete`,
      detail: error instanceof Error ? error.message : "Unknown specialist failure",
    });
    return null;
  }
}

async function runSynthesis(args: {
  client: Anthropic;
  missionRunId: string;
  specification: MissionSpecification;
  campaign: Campaign;
  prepared: unknown;
  reports: MissionWorkerReport[];
  onUsage: UsageSink;
}): Promise<MissionResult> {
  await appendMissionEvent({
    missionRunId: args.missionRunId,
    kind: "synthesis_started",
    agentKey: args.specification.reconciler.key,
    label: `${args.specification.reconciler.name} is reconciling the reports`,
    detail: `${args.reports.length} independent specialist reports reached reconciliation.`,
  });
  const message = await call(
    args.client,
    {
      model: SYNTHESIS_MODEL,
      max_tokens: 10_000,
      system: args.specification.synthesisSystem,
      effort: "high",
      adaptiveThinking: true,
      jsonSchema: args.specification.synthesisJsonSchema,
      messages: [{
        role: "user",
        content: `SPECIALIST REPORTS\n${JSON.stringify(args.reports)}\n\nMISSION INPUT\n${JSON.stringify(args.prepared)}`,
      }],
    },
    { onUsage: args.onUsage },
  );
  const parsed = validateSynthesis(args.specification, parseJSONLoose(textOf(message)));
  return args.specification.normalizeResult(parsed, args.campaign, args.prepared);
}

export async function startMission(
  campaign: Campaign,
  specification: MissionSpecification,
): Promise<{ id: string; work: Promise<void> }> {
  const id = randomUUID();
  const snapshotHash = createHash("sha256").update(JSON.stringify(campaign)).digest("hex");
  await createMissionRun({ id, campaignId: campaign.id, campaign, missionType: specification.type, snapshotHash });
  await appendMissionEvent({
    missionRunId: id,
    kind: "mission_queued",
    label: "Campaign snapshot secured",
    detail: `Snapshot ${snapshotHash.slice(0, 12)} will not change during this mission.`,
  });

  const work = (async () => {
    let spend = 0;
    let reports: MissionWorkerReport[] = [];
    const onUsage: UsageSink = (model, usage) => { spend += costUSD(model, usage); };
    try {
      await setMissionStatus(id, "running");
      await appendMissionEvent({
        missionRunId: id,
        kind: "mission_started",
        label: `${specification.agents.length} independent specialists launched`,
        detail: "Each specialist works from the same immutable campaign snapshot. Their conclusions are reconciled only after the parallel work completes.",
      });
      const prepared = await specification.prepare(campaign);
      const client = getClient(campaign.input.apiKey);
      const outcomes = await Promise.all(specification.agents.map((worker) => runWorker({
        client,
        missionRunId: id,
        specification,
        worker,
        campaign,
        prepared,
        onUsage,
      })));
      reports = outcomes.filter((report): report is MissionWorkerReport => Boolean(report));
      await saveWorkerReports(id, reports);

      const outcome = workerOutcomeStatus(reports.length, specification.agents.length, specification.minimumSuccessfulWorkers);
      if (outcome === "failed") {
        throw new Error(`Only ${reports.length} of ${specification.agents.length} specialist reports completed. At least ${specification.minimumSuccessfulWorkers} are required for responsible synthesis.`);
      }

      const result = await runSynthesis({ client, missionRunId: id, specification, campaign, prepared, reports, onUsage });
      const roundedSpend = Math.round(spend * 10_000) / 10_000;
      await appendMissionEvent({
        missionRunId: id,
        kind: "mission_completed",
        agentKey: specification.reconciler.key,
        label: outcome === "complete" ? "Mission output ready for human review" : "Partial mission output ready for human review",
        detail: result.executiveSummary,
      }).catch(() => {});
      await completeMissionRun({ id, status: outcome, reports, result, costUSD: roundedSpend });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The mission stopped unexpectedly.";
      await appendMissionEvent({
        missionRunId: id,
        kind: "mission_failed",
        agentKey: specification.reconciler.key,
        label: "Mission stopped without a reviewable output",
        detail: message,
      }).catch(() => {});
      await failMissionRun(id, message, reports, Math.round(spend * 10_000) / 10_000);
    } finally {
      await addSpend(spend).catch(() => {});
    }
  })();

  return { id, work };
}
