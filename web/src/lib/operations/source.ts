import type { RunReadModel } from "@/lib/factory/contracts/api";
import { FACTORY_EVENT_TYPES, type FactoryEvent } from "@/lib/factory/contracts/core";
import { CANONICAL_DOCUMENTS, DOCUMENT_STATUSES } from "@/lib/factory/contracts/documents";
import type { CompiledDocument, EvidenceAndNextChecks } from "@/lib/factory/documents";
import { VERIFICATION_LABELS } from "@/lib/pipeline/labels";

export const OPERATIONS_DEFAULT_SOURCE_ORIGIN = "https://campaign-factory.vercel.app";

export const OPERATIONS_PUBLIC_CAMPAIGNS = [
  { id: "69f257b6-9913-4395-94f7-5c25b4b5fe95", sourceHref: `${OPERATIONS_DEFAULT_SOURCE_ORIGIN}/factory/c/69f257b6-9913-4395-94f7-5c25b4b5fe95`, conferenceHero: true },
  { id: "57678ae0-29fd-4b4b-8a53-5c711cdb21cf", sourceHref: `${OPERATIONS_DEFAULT_SOURCE_ORIGIN}/factory/c/57678ae0-29fd-4b4b-8a53-5c711cdb21cf` },
  { id: "6b54225d-afa3-41d1-b053-89741094f153", sourceHref: `${OPERATIONS_DEFAULT_SOURCE_ORIGIN}/factory/c/6b54225d-afa3-41d1-b053-89741094f153` },
] as const;

export const OPERATIONS_PUBLIC_CAMPAIGN_IDS = new Set<string>(OPERATIONS_PUBLIC_CAMPAIGNS.map((campaign) => campaign.id));

export function normaliseOperationsSourceOrigin(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export type OperationsSourcePayload = {
  sourceOrigin: string;
  run: RunReadModel;
  documents: CompiledDocument[];
  evidence: EvidenceAndNextChecks;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

const OPERATIONS_DOCUMENT_KEYS = new Set<string>(CANONICAL_DOCUMENTS.map((doc) => doc.key));
const OPERATIONS_DOCUMENT_STATUSES = new Set<string>(DOCUMENT_STATUSES);
const OPERATIONS_RUN_STATUSES = new Set<string>(["queued", "running", "partial", "completed", "failed", "cancelled"]);
const OPERATIONS_EVENT_TYPES = new Set<string>(FACTORY_EVENT_TYPES);
const OPERATIONS_EVENT_VISIBILITIES = new Set<string>(["public", "internal"]);
const OPERATIONS_VERIFICATION_LABELS = new Set<string>(VERIFICATION_LABELS);
const OPERATIONS_CLAIM_CONFIDENCES = new Set<string>(["high", "medium", "low"]);

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalFiniteNumber(value: unknown): value is number | undefined {
  return value === undefined || isFiniteNumber(value);
}

function isOptionalStringArray(value: unknown): value is string[] | undefined {
  return value === undefined || isStringArray(value);
}

function isOperationsFactoryEvent(value: unknown, campaignId: string): value is FactoryEvent {
  if (!isRecord(value) || !isRecord(value.payload)) return false;
  const payload = value.payload;
  return (
    typeof value.eventId === "string" &&
    isFiniteNumber(value.sequence) &&
    value.campaignId === campaignId &&
    isOptionalString(value.batchId) &&
    isOptionalString(value.agentRunId) &&
    isOptionalString(value.parentAgentRunId) &&
    isOptionalFiniteNumber(value.journeyStep) &&
    typeof value.type === "string" &&
    OPERATIONS_EVENT_TYPES.has(value.type) &&
    typeof value.at === "string" &&
    isOptionalFiniteNumber(value.stateVersion) &&
    typeof value.visibility === "string" &&
    OPERATIONS_EVENT_VISIBILITIES.has(value.visibility) &&
    typeof payload.summary === "string" &&
    isOptionalString(payload.verb) &&
    isOptionalString(payload.agentKey) &&
    isOptionalString(payload.agentDisplayName) &&
    isOptionalStringArray(payload.sourceIds) &&
    isOptionalStringArray(payload.claimIds) &&
    isOptionalString(payload.proposalId) &&
    isOptionalString(payload.judgementId) &&
    isOptionalString(payload.handoffToAgentRunId) &&
    isOptionalFiniteNumber(payload.sectionStep) &&
    isOptionalString(payload.sectionStatus) &&
    isOptionalString(payload.documentKey) &&
    isOptionalString(payload.documentStatus) &&
    (payload.detail === undefined || isRecord(payload.detail))
  );
}

export function isOperationsRunReadModel(value: unknown, campaignId: string): value is RunReadModel {
  if (!isRecord(value) || value.campaignId !== campaignId) return false;
  return (
    isOptionalString(value.batchId) &&
    typeof value.status === "string" &&
    OPERATIONS_RUN_STATUSES.has(value.status) &&
    isFiniteNumber(value.stateVersion) &&
    isFiniteNumber(value.lastSequence) &&
    Array.isArray(value.events) &&
    value.events.every((event) => isOperationsFactoryEvent(event, campaignId))
  );
}

export function isOperationsCompiledDocument(value: unknown): value is CompiledDocument {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    OPERATIONS_DOCUMENT_KEYS.has(value.key) &&
    isFiniteNumber(value.num) &&
    typeof value.name === "string" &&
    typeof value.status === "string" &&
    OPERATIONS_DOCUMENT_STATUSES.has(value.status) &&
    typeof value.html === "string" &&
    typeof value.plainText === "string" &&
    typeof value.isPack === "boolean" &&
    isStringArray(value.sectionKeys) &&
    isFiniteNumber(value.resourceCount) &&
    isStringArray(value.flags)
  );
}

export function isOperationsCompiledDocumentList(value: unknown): value is CompiledDocument[] {
  if (!Array.isArray(value)) return false;
  const seen = new Set<string>();
  for (const doc of value) {
    if (!isOperationsCompiledDocument(doc) || seen.has(doc.key)) return false;
    seen.add(doc.key);
  }
  return true;
}

function isOperationsEvidenceClaimView(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.type === "string" &&
    typeof value.label === "string" &&
    OPERATIONS_VERIFICATION_LABELS.has(value.label) &&
    typeof value.loadBearing === "boolean" &&
    typeof value.confidence === "string" &&
    OPERATIONS_CLAIM_CONFIDENCES.has(value.confidence) &&
    isOptionalString(value.excerpt) &&
    isFiniteNumber(value.sourceCount) &&
    isStringArray(value.affectedOutputs) &&
    isOptionalStringArray(value.contradictsClaimIds)
  );
}

function isOperationsSourceLedgerGroup(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    OPERATIONS_VERIFICATION_LABELS.has(value.label) &&
    isFiniteNumber(value.count) &&
    Array.isArray(value.claims) &&
    value.claims.every(isOperationsEvidenceClaimView)
  );
}

function isOperationsNextCheck(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.description === "string" &&
    typeof value.reason === "string" &&
    isOptionalStringArray(value.claimIds) &&
    isStringArray(value.affectedSections)
  );
}

function isOperationsTerminalGap(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.description === "string" &&
    isOptionalString(value.agentRunId) &&
    isOptionalFiniteNumber(value.step) &&
    typeof value.at === "string"
  );
}

function isOperationsDraftNote(value: unknown) {
  return isRecord(value) && typeof value.text === "string" && typeof value.section === "string";
}

export function isOperationsEvidenceAndNextChecks(value: unknown): value is EvidenceAndNextChecks {
  if (!isRecord(value) || !isRecord(value.totals)) return false;
  const totals = value.totals;
  if (
    !isFiniteNumber(totals.claims) ||
    !isFiniteNumber(totals.loadBearing) ||
    !isFiniteNumber(totals.verifiedLoadBearing) ||
    !isFiniteNumber(totals.unresolvedLoadBearing)
  ) {
    return false;
  }
  return (
    Array.isArray(value.groups) &&
    value.groups.every(isOperationsSourceLedgerGroup) &&
    Array.isArray(value.conflicts) &&
    value.conflicts.every(isOperationsEvidenceClaimView) &&
    Array.isArray(value.nextChecks) &&
    value.nextChecks.every(isOperationsNextCheck) &&
    Array.isArray(value.terminalGaps) &&
    value.terminalGaps.every(isOperationsTerminalGap) &&
    Array.isArray(value.draftNotes) &&
    value.draftNotes.every(isOperationsDraftNote)
  );
}

export function isOperationsPublicCampaignId(id: string) {
  return OPERATIONS_PUBLIC_CAMPAIGN_IDS.has(id);
}
