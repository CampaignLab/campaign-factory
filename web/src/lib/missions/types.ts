import { type Campaign } from "@/lib/pipeline/types";

export type MissionPurpose = "challenge" | "investigate" | "watch" | "prepare";
export type MissionAvailability = "runnable" | "next" | "later";
export type FactoryPattern = "Tribunal" | "Parallel team" | "Persistent loop" | "Response loop";

export type MissionType =
  | "viability_tribunal"
  | "evidence_audit"
  | "decision_route_audit"
  | "precedent_review";

export type MissionStatus = "queued" | "running" | "complete" | "partial" | "failed";
export type ReviewState = "unreviewed" | "reviewed" | "rejected" | "needs_local_knowledge";
export type EvidenceBasis = "evidence" | "inference" | "unknown";

export interface MissionAgentDefinition {
  key: string;
  name: string;
}

export interface MissionDefinition {
  priority: number;
  type?: MissionType;
  slug: string;
  purpose: MissionPurpose;
  name: string;
  shortName: string;
  question: string;
  pattern: FactoryPattern;
  availability: MissionAvailability;
  team: MissionAgentDefinition[];
  tools: string[];
  artefact: string;
  humanDecision: string;
  reviewActions: [string, string, string];
  boundary: string;
  cadence: "one_off" | "persistent";
}

export interface MissionCitation {
  id: string;
  title: string;
  organisation: string;
  url: string;
  date: string;
  sourceKind: "campaign_source" | "primary_official" | "official_secondary" | "other";
}

export interface MissionFinding {
  finding: string;
  basis: EvidenceBasis;
  confidence: "high" | "medium" | "low";
  implication: string;
  citations: MissionCitation[];
}

export interface MissionWorkerReport {
  agentKey: string;
  agentName: string;
  assessment: "supports" | "concern" | "blocking" | "uncertain";
  summary: string;
  findings: MissionFinding[];
  gaps: string[];
}

export type ViabilityVerdict = "viable" | "viable_with_changes" | "uncertain" | "not_currently_viable";

export interface TribunalRationale {
  point: string;
  basis: EvidenceBasis;
  citations: MissionCitation[];
}

export interface TribunalDisagreement {
  issue: string;
  positions: string[];
  chairAssessment: string;
}

export interface ViabilityTribunalResult {
  missionType: "viability_tribunal";
  verdict: ViabilityVerdict;
  executiveSummary: string;
  rationale: TribunalRationale[];
  agreements: string[];
  disagreements: TribunalDisagreement[];
  failureConditions: string[];
  recommendedChanges: string[];
  localKnowledgeQuestions: string[];
  limitations: string[];
}

export type EvidenceAuditStatus =
  | "confirmed"
  | "supported"
  | "conflicted"
  | "stale"
  | "unverifiable"
  | "not_rechecked";

export interface EvidenceAuditFinding {
  itemId: string;
  claim: string;
  originalLabel: string;
  originalEvidence: string;
  status: EvidenceAuditStatus;
  basis: EvidenceBasis;
  explanation: string;
  citations: MissionCitation[];
}

export interface EvidenceAuditResult {
  missionType: "evidence_audit";
  executiveSummary: string;
  findings: EvidenceAuditFinding[];
  verificationQueue: { itemId: string; priority: "high" | "medium" | "low"; reason: string }[];
  gaps: string[];
  limitations: string[];
}

export interface DecisionRouteItem {
  title: string;
  detail: string;
  date?: string;
  body?: string;
  basis: EvidenceBasis;
  citations: MissionCitation[];
}

export interface ProviderCoverage {
  provider: string;
  kind: "parliament_api" | "moderngov_api" | "official_web";
  status: "complete" | "partial" | "unavailable" | "not_applicable";
  detail: string;
  endpoint?: string;
}

export interface DecisionRouteAuditResult {
  missionType: "decision_route_audit";
  executiveSummary: string;
  formalAuthority: DecisionRouteItem[];
  orderedRoute: DecisionRouteItem[];
  interventionPoints: DecisionRouteItem[];
  upcomingMeetings: DecisionRouteItem[];
  recentMinutesAndDecisions: DecisionRouteItem[];
  consultationsAndDeadlines: DecisionRouteItem[];
  conflictingEvidence: DecisionRouteItem[];
  providerCoverage: ProviderCoverage[];
  unresolvedGaps: string[];
  limitations: string[];
}

export interface CampaignPrecedent {
  campaign: string;
  location: string;
  institution: string;
  decisionType: string;
  outcome: string;
  similarities: string[];
  materialDifferences: string[];
  pressureMechanism: string;
  evidenceQuality: "strong" | "mixed" | "weak";
  transferableLessons: string[];
  nonTransferableAssumptions: string[];
  failedOrUnintendedOutcomes: string[];
  causalBasis: EvidenceBasis;
  citations: MissionCitation[];
}

export interface PrecedentReviewResult {
  missionType: "precedent_review";
  executiveSummary: string;
  precedents: CampaignPrecedent[];
  crossCaseLessons: string[];
  localKnowledgeQuestions: string[];
  limitations: string[];
}

export type MissionResult =
  | ViabilityTribunalResult
  | EvidenceAuditResult
  | DecisionRouteAuditResult
  | PrecedentReviewResult;

export interface MissionEvent {
  id: number;
  missionRunId: string;
  kind: string;
  agentKey?: string;
  label: string;
  detail?: string;
  createdAt: string;
}

export interface MissionRun {
  id: string;
  campaignId: string;
  missionType: MissionType;
  status: MissionStatus;
  snapshotHash: string;
  campaignSnapshot?: Campaign;
  workerReports: MissionWorkerReport[];
  result?: MissionResult;
  error?: string;
  costUSD: number;
  reviewState: ReviewState;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  events: MissionEvent[];
}

export interface MissionRunSummary {
  id: string;
  campaignId: string;
  missionType: MissionType;
  status: MissionStatus;
  result?: MissionResult;
  error?: string;
  reviewState: ReviewState;
  createdAt: string;
  completedAt?: string;
}
