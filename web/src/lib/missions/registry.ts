import "server-only";

import { type ZodType } from "zod";
import { type Campaign } from "@/lib/pipeline/types";
import { publicInput } from "@/lib/pipeline/util";
import { getMissionByType, RUNNABLE_MISSIONS } from "./catalogue";
import { buildEvidenceInventory, type EvidenceInventoryItem } from "./evidence-inventory";
import { loadDecisionRouteProviders, type DecisionRouteProviderContext } from "./providers";
import { RESULT_SCHEMAS, WORKER_SCHEMAS, resultJsonSchema, workerJsonSchema } from "./schemas";
import {
  type EvidenceAuditResult,
  type MissionResult,
  type MissionType,
  type MissionWorkerReport,
  type PrecedentReviewResult,
  type ViabilityTribunalResult,
  type DecisionRouteAuditResult,
} from "./types";
import {
  normalizeDecisionRouteResult,
  normalizeEvidenceAuditResult,
  normalizeMissionResult,
} from "./validation";

export interface ExecutableAgent {
  key: string;
  name: string;
  brief: string;
}

export interface MissionSpecification {
  type: MissionType;
  slug: string;
  readiness: (campaign: Campaign) => string[];
  agents: readonly ExecutableAgent[];
  reconciler: ExecutableAgent;
  workerSchema: ZodType<Omit<MissionWorkerReport, "agentKey" | "agentName">>;
  synthesisSchema: ZodType<MissionResult>;
  workerJsonSchema: Record<string, unknown>;
  synthesisJsonSchema: Record<string, unknown>;
  minimumSuccessfulWorkers: number;
  usesWebSearch: boolean;
  workerSystem: string;
  synthesisSystem: string;
  prepare: (campaign: Campaign) => Promise<unknown>;
  normalizeResult: (result: MissionResult, campaign: Campaign, prepared: unknown) => MissionResult;
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

function campaignSources(campaign: Campaign) {
  return campaign.sources.map((source, index) => ({ ...source, id: `S${index + 1}` }));
}

const sharedWorkerRules = `You are one bounded specialist inside Campaign Factory, working on a UK public-policy campaign.

Rules:
- Distinguish evidence, inference and unknowns. Evidence requires at least one valid http(s) citation in the returned finding.
- Never invent a URL, source, named person's position, private intention or institutional view.
- Do not propose autonomous contact, publication, lobbying, profiling or campaign edits.
- Report gaps candidly. A negative or incomplete conclusion is acceptable.
- Return concise British English matching the required JSON schema.`;

const sharedSynthesisRules = `You reconcile independent specialist reports for Campaign Factory.

Preserve material disagreement and missing coverage. Never turn repeated inference into verified fact. Never invent a URL, public position, private intention or institutional view. Recommendations are for human review only and must not imply that the campaign was edited. Return concise British English matching the required JSON schema.`;

function viabilityReadiness(campaign: Campaign): string[] {
  const missing: string[] = [];
  if (!campaign.completed.research || !campaign.research) missing.push("completed campaign research");
  if (!campaign.plan) missing.push("a completed campaign plan");
  return missing;
}

function evidenceReadiness(campaign: Campaign): string[] {
  const missing: string[] = [];
  if (!campaign.completed.research) missing.push("completed campaign research");
  if (!campaign.sources.length && !campaign.lint?.flags.length) missing.push("at least one source claim or unresolved lint item");
  return missing;
}

function decisionRouteReadiness(campaign: Campaign): string[] {
  const missing: string[] = [];
  if (!campaign.completed.research || !campaign.research) missing.push("completed campaign research");
  if (!campaign.input.location && !campaign.research?.location?.area) missing.push("a campaign location");
  if (!campaign.plan?.objective?.dm && !campaign.research?.decisionMaker?.formal) missing.push("a documented decision target");
  return missing;
}

function precedentReadiness(campaign: Campaign): string[] {
  const missing: string[] = [];
  if (!campaign.completed.research || !campaign.research) missing.push("completed campaign research");
  if (!campaign.plan) missing.push("a completed campaign plan");
  return missing;
}

function spec<T extends MissionType>(definition: Omit<MissionSpecification, "slug" | "workerSchema" | "synthesisSchema" | "workerJsonSchema" | "synthesisJsonSchema"> & { type: T }): MissionSpecification {
  const catalogue = getMissionByType(definition.type);
  return {
    ...definition,
    slug: catalogue.slug,
    workerSchema: WORKER_SCHEMAS[definition.type],
    synthesisSchema: RESULT_SCHEMAS[definition.type] as unknown as ZodType<MissionResult>,
    workerJsonSchema: workerJsonSchema(definition.type),
    synthesisJsonSchema: resultJsonSchema(definition.type),
  };
}

const viability = spec({
  type: "viability_tribunal",
  readiness: viabilityReadiness,
  agents: [
    { key: "advocate", name: "Campaign Advocate", brief: "Build the strongest evidence-disciplined case that the campaign can win. Identify the causal route, real assets and conditions required without concealing weak evidence." },
    { key: "falsifier", name: "Campaign Falsifier", brief: "Try to disprove viability. Find broken causal links, unsupported assumptions, likely strategic failure and contradictions." },
    { key: "formal-route", name: "Formal Route Examiner", brief: "Test whether the documented authority, process, timetable and intervention points form a plausible formal route using the supplied evidence register only." },
    { key: "capacity", name: "Capacity Examiner", brief: "Test whether the stated people, time, relationships and resources can execute the strategy and tactics." },
  ],
  reconciler: { key: "chair", name: "Tribunal Chair", brief: "Adjudicate the examinations without flattening disagreement." },
  minimumSuccessfulWorkers: 2,
  usesWebSearch: false,
  workerSystem: `${sharedWorkerRules}\n- Analyse the supplied immutable snapshot only. Cite campaign sources by their supplied S-number and copy the source URL exactly.`,
  synthesisSystem: `${sharedSynthesisRules}\nA campaign is viable only if it has a plausible decision route, coherent pressure mechanism and credible capacity. Return missionType as viability_tribunal.`,
  prepare: async (campaign) => ({ campaign: compactCampaign(campaign), sources: campaignSources(campaign) }),
  normalizeResult: (result, campaign) => normalizeMissionResult(result as ViabilityTribunalResult, campaign),
});

const evidenceAudit = spec({
  type: "evidence_audit",
  readiness: evidenceReadiness,
  agents: [
    { key: "claim-inventory", name: "Claim Inventory Agent", brief: "Check the deterministic inventory for duplicate, ambiguous and strategically material claims. Do not omit items because they seem unimportant." },
    { key: "source-rechecker", name: "Source Rechecker", brief: "Recheck the selected priority claims against their original sources and current public records. Preserve original labels and evidence." },
    { key: "freshness", name: "Freshness Checker", brief: "Identify dates, superseded records, missing pages and claims whose current applicability cannot be established." },
    { key: "conflicts", name: "Conflict Finder", brief: "Look for conflict between campaign claims, cited records and current official evidence. Do not resolve conflict by assumption." },
  ],
  reconciler: { key: "chair", name: "Evidence Chair", brief: "Reconcile the audit and prioritise verification without changing the evidence register." },
  minimumSuccessfulWorkers: 2,
  usesWebSearch: true,
  workerSystem: `${sharedWorkerRules}\n- The full inventory is deterministic. Recheck only items marked recheck=true and never more than 24 items. Preserve original labels and evidence.`,
  synthesisSystem: `${sharedSynthesisRules}\nReturn missionType as evidence_audit. Include confirmed, supported, conflicted, stale, unverifiable and not_rechecked states where applicable. Preserve the supplied item IDs, original labels and original evidence.`,
  prepare: async (campaign) => ({ inventory: buildEvidenceInventory(campaign) }),
  normalizeResult: (result, campaign, prepared) => normalizeEvidenceAuditResult(
    result as EvidenceAuditResult,
    campaign,
    (prepared as { inventory: EvidenceInventoryItem[] }).inventory,
  ),
});

const decisionRoute = spec({
  type: "decision_route_audit",
  readiness: decisionRouteReadiness,
  agents: [
    { key: "authority", name: "Authority and Procedure Researcher", brief: "Establish the formal legal or procedural authority and ordered decision route from primary official records." },
    { key: "council", name: "Council Meetings and Minutes Researcher", brief: "Find relevant council committees, the previous 12 months of minutes and decisions, and upcoming meetings within 90 days." },
    { key: "parliament", name: "Parliament and Public-Body Researcher", brief: "Check supported Parliament records and relevant public-body publications. Explain when national records are not relevant." },
    { key: "timetable", name: "Timetable and Consultation Researcher", brief: "Find consultations, deadlines and practical intervention points in primary official sources." },
  ],
  reconciler: { key: "chair", name: "Route Reconciler", brief: "Reconcile formal authority, route, dates, conflicts and provider gaps without implying complete coverage." },
  minimumSuccessfulWorkers: 2,
  usesWebSearch: true,
  workerSystem: `${sharedWorkerRules}\n- Only primary Parliament, council or public-body records may support a formal-route finding as evidence. Use the supplied provider records first, then official-domain web research. Unsupported coverage must be labelled incomplete.`,
  synthesisSystem: `${sharedSynthesisRules}\nReturn missionType as decision_route_audit. Only primary official records may verify formal authority or the ordered route. Include an explicit provider coverage ledger and unresolved gaps. The default date window is the previous 12 months through the upcoming 90 days.`,
  prepare: async (campaign) => ({ campaign: compactCampaign(campaign), providers: await loadDecisionRouteProviders(campaign) }),
  normalizeResult: (result, campaign, prepared) => normalizeDecisionRouteResult(
    result as DecisionRouteAuditResult,
    campaign,
    (prepared as { providers: DecisionRouteProviderContext }).providers.coverage,
  ),
});

const precedentReview = spec({
  type: "precedent_review",
  readiness: precedentReadiness,
  agents: [
    { key: "issue", name: "Issue Similarity Researcher", brief: "Find sourced campaigns with a genuinely comparable issue and identify material issue differences." },
    { key: "institution", name: "Institution Comparator", brief: "Compare institutions, decision types, authority and local context rather than relying on surface resemblance." },
    { key: "pressure", name: "Pressure and Tactics Researcher", brief: "Examine documented pressure mechanisms and tactics. Keep outcome correlation separate from causation." },
    { key: "failure", name: "Failure and Unintended-Effects Researcher", brief: "Find failed campaigns, adverse outcomes and unintended effects that success stories omit." },
  ],
  reconciler: { key: "chair", name: "Transferability Chair", brief: "Select three to six useful precedents and state what does and does not transfer." },
  minimumSuccessfulWorkers: 2,
  usesWebSearch: true,
  workerSystem: `${sharedWorkerRules}\n- Search for both success and failure. A tactic-outcome association is inference unless a cited source directly establishes causation.`,
  synthesisSystem: `${sharedSynthesisRules}\nReturn missionType as precedent_review and three to six sourced precedents. Include location, institution, decision type, outcome, similarities, material differences, pressure mechanism, evidence quality, transferable lessons, non-transferable assumptions, failures and unintended outcomes. Causal claims remain inference.`,
  prepare: async (campaign) => ({ campaign: compactCampaign(campaign), existingSources: campaignSources(campaign) }),
  normalizeResult: (result, campaign) => normalizeMissionResult(result as PrecedentReviewResult, campaign),
});

export const MISSION_REGISTRY: Readonly<Record<MissionType, MissionSpecification>> = {
  viability_tribunal: viability,
  evidence_audit: evidenceAudit,
  decision_route_audit: decisionRoute,
  precedent_review: precedentReview,
};

export function getMissionSpecification(type: MissionType): MissionSpecification {
  return MISSION_REGISTRY[type];
}

export function getMissionSpecificationBySlug(slug: string): MissionSpecification | undefined {
  return Object.values(MISSION_REGISTRY).find((mission) => mission.slug === slug);
}

export function validateMissionRegistry(): string[] {
  const errors: string[] = [];
  const catalogueTypes = new Set(RUNNABLE_MISSIONS.map((mission) => mission.type));
  for (const [type, mission] of Object.entries(MISSION_REGISTRY)) {
    if (mission.type !== type) errors.push(`${type} has a mismatched specification type`);
    if (!catalogueTypes.has(mission.type)) errors.push(`${type} has no runnable catalogue entry`);
    const keys = [...mission.agents.map((agent) => agent.key), mission.reconciler.key];
    if (new Set(keys).size !== keys.length) errors.push(`${type} has duplicate agent keys`);
    if (mission.minimumSuccessfulWorkers < 1 || mission.minimumSuccessfulWorkers > mission.agents.length) {
      errors.push(`${type} has an invalid minimum worker threshold`);
    }
  }
  return errors;
}
