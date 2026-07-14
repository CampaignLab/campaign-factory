import { type Campaign } from "@/lib/pipeline/types";

export type MissionPurpose = "challenge" | "investigate" | "watch" | "prepare";
export type MissionAvailability = "available" | "up_next" | "future";
export type FactoryPattern = "Tribunal" | "Parallel Team" | "Persistent Loop" | "Response Loop";
export type MissionType = "viability_tribunal";
export type MissionStatus = "queued" | "running" | "complete" | "partial" | "failed";
export type ReviewState = "unreviewed" | "reviewed" | "rejected" | "needs_local_knowledge";

export interface MissionDefinition {
  slug: string;
  purpose: MissionPurpose;
  name: string;
  question: string;
  pattern: FactoryPattern;
  availability: MissionAvailability;
  team: string[];
  artefact: string;
  humanDecision: string;
  boundary: string;
  cadence: "one_off" | "persistent";
}

export interface MissionEvidenceReference {
  id: string;
  title: string;
  organisation: string;
  url: string;
  status: string;
}

export interface WorkerFinding {
  finding: string;
  evidenceRefs: string[];
  basis: "evidence" | "inference" | "unknown";
  confidence: "high" | "medium" | "low";
  implication: string;
}

export interface WorkerReport {
  agentKey: string;
  agentName: string;
  assessment: "supports_viability" | "concern" | "blocking" | "uncertain";
  summary: string;
  findings: WorkerFinding[];
  conditions: string[];
  openQuestions: string[];
}

export type ViabilityVerdict = "viable" | "viable_with_changes" | "uncertain" | "not_currently_viable";

export interface TribunalRationale {
  point: string;
  evidenceRefs: string[];
  basis: "evidence" | "inference" | "unknown";
}

export interface TribunalDisagreement {
  issue: string;
  positions: string[];
  chairAssessment: string;
}

export interface ViabilityTribunalResult {
  verdict: ViabilityVerdict;
  executiveSummary: string;
  rationale: TribunalRationale[];
  agreements: string[];
  disagreements: TribunalDisagreement[];
  failureConditions: string[];
  recommendedChanges: string[];
  localKnowledgeQuestions: string[];
  limitations: string[];
  evidenceRefs: string[];
}

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
  workerReports: WorkerReport[];
  result?: ViabilityTribunalResult;
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
  result?: ViabilityTribunalResult;
  error?: string;
  reviewState: ReviewState;
  createdAt: string;
  completedAt?: string;
}
