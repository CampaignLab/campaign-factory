import { type Campaign } from "@/lib/pipeline/types";
import { type EvidenceInventoryItem } from "./evidence-inventory";
import {
  type DecisionRouteAuditResult,
  type DecisionRouteItem,
  type EvidenceAuditResult,
  type MissionCitation,
  type MissionResult,
  type MissionWorkerReport,
  type PrecedentReviewResult,
  type ProviderCoverage,
  type ViabilityTribunalResult,
} from "./types";

export function isValidCitationUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function isPrimaryOfficialUrl(value: string): boolean {
  if (!isValidCitationUrl(value)) return false;
  const host = new URL(value).hostname.toLowerCase();
  return host === "gov.uk"
    || host.endsWith(".gov.uk")
    || host === "parliament.uk"
    || host.endsWith(".parliament.uk")
    || host === "nhs.uk"
    || host.endsWith(".nhs.uk");
}

function campaignCitation(citation: MissionCitation, campaign: Campaign): MissionCitation | null {
  if (!/^S\d+$/.test(citation.id)) return null;
  const source = campaign.sources[Number(citation.id.slice(1)) - 1];
  if (!source || !isValidCitationUrl(source.url)) return null;
  return {
    id: citation.id,
    title: source.sourceTitle,
    organisation: source.sourceOrg,
    url: source.url,
    date: source.date || source.accessDate,
    sourceKind: isPrimaryOfficialUrl(source.url) ? "primary_official" : "campaign_source",
  };
}

export function normalizeCitations(citations: MissionCitation[], campaign: Campaign): MissionCitation[] {
  const normalized = (citations || []).flatMap((citation) => {
    if (citation.sourceKind === "campaign_source" || /^S\d+$/.test(citation.id)) {
      const source = campaignCitation(citation, campaign);
      return source ? [source] : [];
    }
    if (!isValidCitationUrl(citation.url)) return [];
    return [{
      ...citation,
      url: new URL(citation.url).toString(),
      sourceKind: isPrimaryOfficialUrl(citation.url) ? "primary_official" as const : citation.sourceKind,
    }];
  });
  return [...new Map(normalized.map((citation) => [citation.url, citation])).values()];
}

export function normalizeWorkerReport(report: MissionWorkerReport, campaign: Campaign): MissionWorkerReport {
  return {
    ...report,
    findings: report.findings.map((finding) => {
      const citations = normalizeCitations(finding.citations, campaign);
      return {
        ...finding,
        citations,
        basis: finding.basis === "evidence" && !citations.length ? "unknown" : finding.basis,
      };
    }),
  };
}

export function normalizeViabilityResult(result: ViabilityTribunalResult, campaign: Campaign): ViabilityTribunalResult {
  return {
    ...result,
    rationale: result.rationale.map((item) => {
      const citations = normalizeCitations(item.citations, campaign);
      return { ...item, citations, basis: item.basis === "evidence" && !citations.length ? "unknown" : item.basis };
    }),
  };
}

export function normalizeEvidenceAuditResult(
  result: EvidenceAuditResult,
  campaign: Campaign,
  inventory: EvidenceInventoryItem[],
): EvidenceAuditResult {
  const reported = new Map(result.findings.map((finding) => [finding.itemId, finding]));
  const findings = inventory.map((item) => {
    const finding = reported.get(item.itemId);
    if (!item.recheck) {
      return {
        itemId: item.itemId,
        claim: item.claim,
        originalLabel: item.originalLabel,
        originalEvidence: item.originalEvidence,
        status: "not_rechecked" as const,
        basis: "unknown" as const,
        explanation: "Outside this run's 24-item recheck limit. The original label and evidence are preserved.",
        citations: [],
      };
    }

    const citations = normalizeCitations(finding?.citations || [], campaign);
    const unsupportedEvidence = finding?.basis === "evidence" && !citations.length;
    const status = !finding || unsupportedEvidence || (["confirmed", "supported"].includes(finding.status) && !citations.length)
      ? "unverifiable" as const
      : finding.status;
    return {
      itemId: item.itemId,
      claim: item.claim,
      originalLabel: item.originalLabel,
      originalEvidence: item.originalEvidence,
      status,
      basis: unsupportedEvidence ? "unknown" as const : finding?.basis || "unknown" as const,
      explanation: finding?.explanation || "The recheck did not return enough valid evidence to classify this item.",
      citations,
    };
  });
  const knownIds = new Set(inventory.map((item) => item.itemId));
  return {
    ...result,
    findings,
    verificationQueue: result.verificationQueue.filter((item) => knownIds.has(item.itemId)),
    limitations: [...new Set([
      ...result.limitations,
      `At most 24 priority items were rechecked; ${inventory.filter((item) => !item.recheck).length} item(s) are labelled not rechecked.`,
    ])],
  };
}

function normalizeRouteItem(item: DecisionRouteItem, campaign: Campaign, officialOnly: boolean): DecisionRouteItem {
  const citations = normalizeCitations(item.citations, campaign);
  const qualifying = officialOnly ? citations.filter((citation) => isPrimaryOfficialUrl(citation.url)) : citations;
  return {
    ...item,
    citations,
    basis: item.basis === "evidence" && !qualifying.length ? "unknown" : item.basis,
  };
}

export function normalizeDecisionRouteResult(
  result: DecisionRouteAuditResult,
  campaign: Campaign,
  providerCoverage: ProviderCoverage[],
): DecisionRouteAuditResult {
  const normalize = (items: DecisionRouteItem[], officialOnly = false) => items.map((item) => normalizeRouteItem(item, campaign, officialOnly));
  const incomplete = providerCoverage.some((provider) => provider.status !== "complete");
  return {
    ...result,
    formalAuthority: normalize(result.formalAuthority, true),
    orderedRoute: normalize(result.orderedRoute, true),
    interventionPoints: normalize(result.interventionPoints),
    upcomingMeetings: normalize(result.upcomingMeetings),
    recentMinutesAndDecisions: normalize(result.recentMinutesAndDecisions),
    consultationsAndDeadlines: normalize(result.consultationsAndDeadlines),
    conflictingEvidence: normalize(result.conflictingEvidence),
    providerCoverage,
    unresolvedGaps: [...new Set([
      ...result.unresolvedGaps,
      ...(incomplete ? ["Provider coverage is incomplete. Absence from the returned records is not evidence that no route, meeting or deadline exists."] : []),
    ])],
  };
}

export function normalizePrecedentResult(result: PrecedentReviewResult, campaign: Campaign): PrecedentReviewResult {
  return {
    ...result,
    precedents: result.precedents.map((precedent) => {
      const citations = normalizeCitations(precedent.citations, campaign);
      return {
        ...precedent,
        citations,
        evidenceQuality: !citations.length ? "weak" : precedent.evidenceQuality,
        // Causality is kept as inference at this boundary. A future direct-evidence
        // field can promote it after deterministic inspection of the cited record.
        causalBasis: precedent.causalBasis === "unknown" ? "unknown" : "inference",
      };
    }),
  };
}

export function normalizeMissionResult(result: MissionResult, campaign: Campaign): MissionResult {
  if (result.missionType === "viability_tribunal") return normalizeViabilityResult(result, campaign);
  if (result.missionType === "precedent_review") return normalizePrecedentResult(result, campaign);
  return result;
}
