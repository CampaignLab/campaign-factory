import { z } from "zod";
import { type MissionResult, type MissionType, type MissionWorkerReport } from "./types";

const BasisSchema = z.enum(["evidence", "inference", "unknown"]);
const CitationSchema = z.object({
  id: z.string(),
  title: z.string(),
  organisation: z.string(),
  url: z.string(),
  date: z.string(),
  sourceKind: z.enum(["campaign_source", "primary_official", "official_secondary", "other"]),
}).strict();

const FindingSchema = z.object({
  finding: z.string(),
  basis: BasisSchema,
  confidence: z.enum(["high", "medium", "low"]),
  implication: z.string(),
  citations: z.array(CitationSchema).max(8),
}).strict();

const BaseWorkerReportSchema = z.object({
  assessment: z.enum(["supports", "concern", "blocking", "uncertain"]),
  summary: z.string(),
  findings: z.array(FindingSchema).max(10),
  gaps: z.array(z.string()).max(8),
}).strict();

const RationaleSchema = z.object({
  point: z.string(),
  basis: BasisSchema,
  citations: z.array(CitationSchema).max(8),
}).strict();

const RouteItemSchema = z.object({
  title: z.string(),
  detail: z.string(),
  date: z.string().optional(),
  body: z.string().optional(),
  basis: BasisSchema,
  citations: z.array(CitationSchema).max(8),
}).strict();

export const ViabilityResultSchema = z.object({
  missionType: z.literal("viability_tribunal"),
  verdict: z.enum(["viable", "viable_with_changes", "uncertain", "not_currently_viable"]),
  executiveSummary: z.string(),
  rationale: z.array(RationaleSchema).max(8),
  agreements: z.array(z.string()).max(8),
  disagreements: z.array(z.object({
    issue: z.string(),
    positions: z.array(z.string()).max(6),
    chairAssessment: z.string(),
  }).strict()).max(6),
  failureConditions: z.array(z.string()).max(8),
  recommendedChanges: z.array(z.string()).max(8),
  localKnowledgeQuestions: z.array(z.string()).max(8),
  limitations: z.array(z.string()).max(8),
}).strict();

export const EvidenceAuditResultSchema = z.object({
  missionType: z.literal("evidence_audit"),
  executiveSummary: z.string(),
  findings: z.array(z.object({
    itemId: z.string(),
    claim: z.string(),
    originalLabel: z.string(),
    originalEvidence: z.string(),
    status: z.enum(["confirmed", "supported", "conflicted", "stale", "unverifiable", "not_rechecked"]),
    basis: BasisSchema,
    explanation: z.string(),
    citations: z.array(CitationSchema).max(8),
  }).strict()).max(80),
  verificationQueue: z.array(z.object({
    itemId: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    reason: z.string(),
  }).strict()).max(24),
  gaps: z.array(z.string()).max(12),
  limitations: z.array(z.string()).max(8),
}).strict();

export const DecisionRouteAuditResultSchema = z.object({
  missionType: z.literal("decision_route_audit"),
  executiveSummary: z.string(),
  formalAuthority: z.array(RouteItemSchema).max(12),
  orderedRoute: z.array(RouteItemSchema).max(16),
  interventionPoints: z.array(RouteItemSchema).max(12),
  upcomingMeetings: z.array(RouteItemSchema).max(16),
  recentMinutesAndDecisions: z.array(RouteItemSchema).max(16),
  consultationsAndDeadlines: z.array(RouteItemSchema).max(16),
  conflictingEvidence: z.array(RouteItemSchema).max(12),
  providerCoverage: z.array(z.object({
    provider: z.string(),
    kind: z.enum(["parliament_api", "moderngov_api", "official_web"]),
    status: z.enum(["complete", "partial", "unavailable", "not_applicable"]),
    detail: z.string(),
    endpoint: z.string().optional(),
  }).strict()).max(12),
  unresolvedGaps: z.array(z.string()).max(16),
  limitations: z.array(z.string()).max(8),
}).strict();

export const PrecedentReviewResultSchema = z.object({
  missionType: z.literal("precedent_review"),
  executiveSummary: z.string(),
  precedents: z.array(z.object({
    campaign: z.string(),
    location: z.string(),
    institution: z.string(),
    decisionType: z.string(),
    outcome: z.string(),
    similarities: z.array(z.string()).max(8),
    materialDifferences: z.array(z.string()).max(8),
    pressureMechanism: z.string(),
    evidenceQuality: z.enum(["strong", "mixed", "weak"]),
    transferableLessons: z.array(z.string()).max(8),
    nonTransferableAssumptions: z.array(z.string()).max(8),
    failedOrUnintendedOutcomes: z.array(z.string()).max(8),
    causalBasis: BasisSchema,
    citations: z.array(CitationSchema).max(10),
  }).strict()).min(3).max(6),
  crossCaseLessons: z.array(z.string()).max(10),
  localKnowledgeQuestions: z.array(z.string()).max(10),
  limitations: z.array(z.string()).max(8),
}).strict();

export const WORKER_SCHEMAS: Record<MissionType, typeof BaseWorkerReportSchema> = {
  viability_tribunal: BaseWorkerReportSchema,
  evidence_audit: BaseWorkerReportSchema,
  decision_route_audit: BaseWorkerReportSchema,
  precedent_review: BaseWorkerReportSchema,
};

export const RESULT_SCHEMAS = {
  viability_tribunal: ViabilityResultSchema,
  evidence_audit: EvidenceAuditResultSchema,
  decision_route_audit: DecisionRouteAuditResultSchema,
  precedent_review: PrecedentReviewResultSchema,
} as const;

export function workerJsonSchema(type: MissionType): Record<string, unknown> {
  return z.toJSONSchema(WORKER_SCHEMAS[type], { target: "draft-7" }) as Record<string, unknown>;
}

export function resultJsonSchema(type: MissionType): Record<string, unknown> {
  return z.toJSONSchema(RESULT_SCHEMAS[type], { target: "draft-7" }) as Record<string, unknown>;
}

export function parseWorkerReport(type: MissionType, value: unknown): Omit<MissionWorkerReport, "agentKey" | "agentName"> {
  return WORKER_SCHEMAS[type].parse(value);
}

export function parseMissionResult(type: MissionType, value: unknown): MissionResult {
  return RESULT_SCHEMAS[type].parse(value) as MissionResult;
}

function legacyEvidenceRefs(value: unknown): Array<{ id: string; title: string; organisation: string; url: string; date: string; sourceKind: "campaign_source" }> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((id) => ({
    id,
    title: id,
    organisation: "Campaign evidence register",
    url: "",
    date: "",
    sourceKind: "campaign_source",
  }));
}

export function parseStoredMissionResult(type: MissionType, value: unknown): MissionResult {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : null;
  if (type !== "viability_tribunal" || record?.missionType) return parseMissionResult(type, value);
  const rationale = Array.isArray(record?.rationale) ? record.rationale.map((item) => {
    const legacy = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      point: typeof legacy.point === "string" ? legacy.point : "",
      basis: legacy.basis,
      citations: legacyEvidenceRefs(legacy.evidenceRefs),
    };
  }) : [];
  return parseMissionResult(type, {
    missionType: type,
    verdict: record?.verdict,
    executiveSummary: record?.executiveSummary,
    rationale,
    agreements: record?.agreements || [],
    disagreements: record?.disagreements || [],
    failureConditions: record?.failureConditions || [],
    recommendedChanges: record?.recommendedChanges || [],
    localKnowledgeQuestions: record?.localKnowledgeQuestions || [],
    limitations: record?.limitations || [],
  });
}

export function isMissionType(value: unknown): value is MissionType {
  return typeof value === "string" && Object.hasOwn(RESULT_SCHEMAS, value);
}
