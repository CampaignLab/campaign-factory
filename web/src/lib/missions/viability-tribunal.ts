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
import { costUSD, type UsageSink } from "@/lib/spend/pricing";
import { type Campaign } from "@/lib/pipeline/types";
import { publicInput } from "@/lib/pipeline/util";
import { TRIBUNAL_RESULT_SCHEMA, WORKER_REPORT_SCHEMA } from "./schemas";
import { type ViabilityTribunalResult, type WorkerReport } from "./types";

const WORKER_MODEL = "claude-sonnet-5";
const CHAIR_MODEL = "claude-sonnet-5";

const WORKERS = [
  {
    key: "advocate",
    name: "Campaign Advocate",
    brief: "Build the strongest evidence-disciplined case that the campaign can win. Identify the causal route, real assets and conditions required. Do not cheerlead or conceal weak evidence.",
  },
  {
    key: "falsifier",
    name: "Campaign Falsifier",
    brief: "Try to disprove the campaign's viability. Find broken causal links, unsupported assumptions, likely strategic failure and contradictions. A negative conclusion is acceptable, but every claim must distinguish evidence from inference.",
  },
  {
    key: "formal-route",
    name: "Formal Route Examiner",
    brief: "Examine whether the named decision, authority, process, timetable and intervention points form a plausible formal route. Use only the campaign snapshot and its cited public evidence. Treat undocumented influence as unknown.",
  },
  {
    key: "capacity",
    name: "Capacity Examiner",
    brief: "Test whether the stated people, time, relationships and resources can execute the strategy and tactics. Identify dependencies, overload and minimum operating conditions. Do not assume capacity that is absent from the campaign snapshot.",
  },
] as const;

const SYSTEM = `You are one bounded examiner inside Campaign Factory's Viability Tribunal for a UK hyperlocal public-policy campaign.

Rules:
- Analyse the supplied campaign snapshot only. You have no web access in this mission.
- Cite evidence only with source IDs supplied in the evidence register, such as S1. Never invent an ID, source, fact, public position or private intention.
- Mark a finding as evidence only when the cited source directly supports it. Otherwise use inference or unknown.
- Named people's positions are not facts unless the evidence register explicitly supports them.
- Be candid. The mission may conclude that the campaign is not currently viable.
- Do not propose autonomous contact, publication, lobbying, profiling or campaign changes.
- Return concise British English that matches the required JSON schema.`;

const CHAIR_SYSTEM = `You chair Campaign Factory's Viability Tribunal for a UK hyperlocal public-policy campaign.

Adjudicate four independent reports. Do not average them into false consensus. Preserve substantive disagreement, distinguish verified evidence from strategic inference, and expose missing local knowledge. A campaign is viable only if there is a plausible decision route, a coherent pressure mechanism and credible operating capacity. A positive verdict is not required.

Use only supplied source IDs. Never invent evidence, a source, a person's position or an institutional intention. Recommended changes are advice for a human review; they must not imply that the campaign has been edited. Do not recommend autonomous contact, publishing, lobbying or individual profiling. Return concise British English matching the required JSON schema.`;

function evidenceRegister(campaign: Campaign) {
  return (campaign.sources || []).map((source, index) => ({
    id: `S${index + 1}`,
    claim: source.claim,
    status: source.status,
    title: source.sourceTitle,
    organisation: source.sourceOrg,
    url: source.url,
    date: source.date,
    evidence: source.evidence,
    confidence: source.confidence,
    usedFor: source.usedFor,
  }));
}

function compactCampaign(campaign: Campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    problem: campaign.refinedProblem || campaign.input.problem,
    input: publicInput(campaign.input),
    location: campaign.research?.location,
    context: campaign.research?.context,
    decisionMaker: campaign.research?.decisionMaker,
    unresolvedResearch: campaign.research?.unresolvedQuestions,
    objective: campaign.plan?.objective,
    stakeholders: campaign.plan?.stakeholders,
    pressures: campaign.plan?.pressures,
    strategy: campaign.plan?.strategy,
    tactics: campaign.plan?.tactics,
    organising: campaign.plan?.organising,
    risks: campaign.plan?.risks,
    assumptions: campaign.plan?.assumptions,
    qualityFlags: campaign.plan?.qualityFlags,
    lint: campaign.lint,
  };
}

function cleanRefs(refs: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(refs)) return [];
  return [...new Set(refs.filter((ref): ref is string => typeof ref === "string" && allowed.has(ref)))];
}

function cleanWorkerReport(raw: Omit<WorkerReport, "agentKey" | "agentName">, agentKey: string, agentName: string, allowed: Set<string>): WorkerReport {
  return {
    ...raw,
    agentKey,
    agentName,
    findings: (raw.findings || []).map((finding) => {
      const evidenceRefs = cleanRefs(finding.evidenceRefs, allowed);
      return { ...finding, evidenceRefs, basis: finding.basis === "evidence" && !evidenceRefs.length ? "unknown" : finding.basis };
    }),
  };
}

function cleanResult(raw: ViabilityTribunalResult, allowed: Set<string>): ViabilityTribunalResult {
  return {
    ...raw,
    evidenceRefs: cleanRefs(raw.evidenceRefs, allowed),
    rationale: (raw.rationale || []).map((item) => {
      const evidenceRefs = cleanRefs(item.evidenceRefs, allowed);
      return { ...item, evidenceRefs, basis: item.basis === "evidence" && !evidenceRefs.length ? "unknown" : item.basis };
    }),
  };
}

async function runWorker(args: {
  client: Anthropic;
  missionRunId: string;
  worker: (typeof WORKERS)[number];
  campaignContext: ReturnType<typeof compactCampaign>;
  sources: ReturnType<typeof evidenceRegister>;
  allowedRefs: Set<string>;
  onUsage: UsageSink;
}): Promise<WorkerReport | null> {
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
        max_tokens: 4500,
        system: SYSTEM,
        effort: "medium",
        adaptiveThinking: true,
        jsonSchema: WORKER_REPORT_SCHEMA,
        messages: [
          {
            role: "user",
            content: `${args.worker.brief}\n\nCAMPAIGN SNAPSHOT\n${JSON.stringify(args.campaignContext)}\n\nEVIDENCE REGISTER\n${JSON.stringify(args.sources)}`,
          },
        ],
      },
      { onUsage: args.onUsage },
    );
    const report = cleanWorkerReport(
      parseJSONLoose<Omit<WorkerReport, "agentKey" | "agentName">>(textOf(message)),
      args.worker.key,
      args.worker.name,
      args.allowedRefs,
    );
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
      detail: error instanceof Error ? error.message : "Unknown examiner failure",
    });
    return null;
  }
}

async function runChair(args: {
  client: Anthropic;
  missionRunId: string;
  reports: WorkerReport[];
  sources: ReturnType<typeof evidenceRegister>;
  allowedRefs: Set<string>;
  onUsage: UsageSink;
}): Promise<ViabilityTribunalResult> {
  await appendMissionEvent({
    missionRunId: args.missionRunId,
    kind: "synthesis_started",
    agentKey: "chair",
    label: "Tribunal Chair is reconciling the reports",
    detail: `${args.reports.length} independent examinations reached adjudication.`,
  });
  const message = await call(
    args.client,
    {
      model: CHAIR_MODEL,
      max_tokens: 6000,
      system: CHAIR_SYSTEM,
      effort: "high",
      adaptiveThinking: true,
      jsonSchema: TRIBUNAL_RESULT_SCHEMA,
      messages: [
        {
          role: "user",
          content: `EXAMINER REPORTS\n${JSON.stringify(args.reports)}\n\nEVIDENCE REGISTER\n${JSON.stringify(args.sources)}`,
        },
      ],
    },
    { onUsage: args.onUsage },
  );
  return cleanResult(parseJSONLoose<ViabilityTribunalResult>(textOf(message)), args.allowedRefs);
}

export async function startViabilityTribunal(campaign: Campaign): Promise<{ id: string; work: Promise<void> }> {
  const id = randomUUID();
  const snapshotHash = createHash("sha256").update(JSON.stringify(campaign)).digest("hex");
  await createMissionRun({ id, campaignId: campaign.id, campaign, snapshotHash });
  await appendMissionEvent({
    missionRunId: id,
    kind: "mission_queued",
    label: "Campaign snapshot secured",
    detail: `Snapshot ${snapshotHash.slice(0, 12)} will not change during this review.`,
  });

  const work = (async () => {
    let spend = 0;
    let reports: WorkerReport[] = [];
    const onUsage: UsageSink = (model, usage) => {
      spend += costUSD(model, usage);
    };
    try {
      await setMissionStatus(id, "running");
      await appendMissionEvent({
        missionRunId: id,
        kind: "mission_started",
        label: "Four independent examinations launched",
        detail: "The examiners work from the same immutable campaign snapshot and do not see one another's conclusions.",
      });
      const client = getClient(campaign.input.apiKey);
      const sources = evidenceRegister(campaign);
      const allowedRefs = new Set(sources.map((source) => source.id));
      const campaignContext = compactCampaign(campaign);
      const outcomes = await Promise.all(
        WORKERS.map((worker) => runWorker({ client, missionRunId: id, worker, campaignContext, sources, allowedRefs, onUsage })),
      );
      reports = outcomes.filter((report): report is WorkerReport => Boolean(report));
      await saveWorkerReports(id, reports);

      if (reports.length < 2) {
        throw new Error("Fewer than two independent examinations completed, so the tribunal could not adjudicate responsibly.");
      }

      const result = await runChair({ client, missionRunId: id, reports, sources, allowedRefs, onUsage });
      const status = reports.length === WORKERS.length ? "complete" : "partial";
      const roundedSpend = Math.round(spend * 10000) / 10000;
      await appendMissionEvent({
        missionRunId: id,
        kind: "mission_completed",
        agentKey: "chair",
        label: status === "complete" ? "Tribunal verdict ready for human review" : "Partial tribunal verdict ready for human review",
        detail: result.executiveSummary,
      }).catch(() => {});
      // Write the terminal status after the final event so a polling client never
      // stops on `complete` before the last audit entry is visible.
      await completeMissionRun({ id, status, reports, result, costUSD: roundedSpend });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The tribunal stopped unexpectedly.";
      await appendMissionEvent({
        missionRunId: id,
        kind: "mission_failed",
        label: "Tribunal stopped without a verdict",
        detail: message,
      }).catch(() => {});
      await failMissionRun(id, message, reports, Math.round(spend * 10000) / 10000);
    } finally {
      await addSpend(spend).catch(() => {});
    }
  })();

  return { id, work };
}
