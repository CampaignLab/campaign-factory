import { describe, expect, it } from "vitest";
import { mapMissionRunSummaryRow } from "@/lib/db/mission-rows";
import { buildEvidenceInventory } from "./evidence-inventory";
import { parseMissionResult } from "./schemas";
import { normalizeEvidenceAuditResult, normalizeWorkerReport } from "./validation";
import { type Campaign, type SourceClaim } from "@/lib/pipeline/types";
import { type EvidenceAuditResult, type MissionWorkerReport } from "./types";

function source(index: number): SourceClaim {
  return {
    claim: `Claim ${index}`,
    status: "Verification incomplete",
    sourceTitle: `Source ${index}`,
    sourceOrg: "Example Council",
    url: `https://example.gov.uk/source/${index}`,
    date: "2026-06-01",
    accessDate: "2026-07-14",
    evidence: `Original evidence ${index}`,
    confidence: "Medium",
    usedFor: "Test",
  };
}

function campaignWithSources(count: number): Campaign {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Test campaign",
    input: { problem: "A local issue" },
    sources: Array.from({ length: count }, (_, index) => source(index + 1)),
    completed: { research: true, plan: true, drafts: true, lint: true },
    createdAt: "2026-07-14T10:00:00Z",
  };
}

describe("mission result validation", () => {
  it("rejects invalid citation URLs and downgrades unsupported evidence", () => {
    const report: MissionWorkerReport = {
      agentKey: "researcher",
      agentName: "Researcher",
      assessment: "concern",
      summary: "A report",
      gaps: [],
      findings: [{
        finding: "Unsupported finding",
        basis: "evidence",
        confidence: "high",
        implication: "Do not rely on it",
        citations: [{ id: "X1", title: "Bad", organisation: "Bad", url: "javascript:alert(1)", date: "", sourceKind: "other" }],
      }],
    };
    const normalized = normalizeWorkerReport(report, campaignWithSources(1));
    expect(normalized.findings[0].citations).toEqual([]);
    expect(normalized.findings[0].basis).toBe("unknown");
  });

  it("inventories every claim while limiting rechecks to 24", () => {
    const campaign = campaignWithSources(26);
    const inventory = buildEvidenceInventory(campaign);
    const raw: EvidenceAuditResult = {
      missionType: "evidence_audit",
      executiveSummary: "Audit summary",
      findings: [{
        itemId: "S1",
        claim: "Rewritten claim",
        originalLabel: "Rewritten label",
        originalEvidence: "Rewritten evidence",
        status: "supported",
        basis: "evidence",
        explanation: "Unsupported",
        citations: [],
      }],
      verificationQueue: [],
      gaps: [],
      limitations: [],
    };
    const result = normalizeEvidenceAuditResult(raw, campaign, inventory);
    expect(result.findings).toHaveLength(26);
    expect(result.findings.filter((finding) => finding.status === "not_rechecked")).toHaveLength(2);
    expect(result.findings[0]).toMatchObject({
      claim: "Claim 1",
      originalLabel: "Verification incomplete",
      originalEvidence: "Original evidence 1",
      status: "unverifiable",
      basis: "unknown",
    });
  });

  it("maps the actual mission_type column and validates its discriminated result", () => {
    const result: EvidenceAuditResult = {
      missionType: "evidence_audit",
      executiveSummary: "Audit complete",
      findings: [],
      verificationQueue: [],
      gaps: [],
      limitations: [],
    };
    const mapped = mapMissionRunSummaryRow({
      id: "22222222-2222-4222-8222-222222222222",
      campaign_id: "11111111-1111-4111-8111-111111111111",
      mission_type: "evidence_audit",
      status: "complete",
      result,
      review_state: "unreviewed",
      created_at: new Date("2026-07-14T10:00:00Z"),
      completed_at: new Date("2026-07-14T10:05:00Z"),
    });
    expect(mapped.missionType).toBe("evidence_audit");
    expect(mapped.result?.missionType).toBe("evidence_audit");
    expect(() => parseMissionResult("viability_tribunal", result)).toThrow();
  });

  it("keeps legacy Viability rows readable through the stored-row adapter", () => {
    const mapped = mapMissionRunSummaryRow({
      id: "33333333-3333-4333-8333-333333333333",
      campaign_id: "11111111-1111-4111-8111-111111111111",
      mission_type: "viability_tribunal",
      status: "complete",
      result: {
        verdict: "uncertain",
        executiveSummary: "Legacy verdict",
        rationale: [{ point: "A legacy point", basis: "evidence", evidenceRefs: ["S1"] }],
        agreements: [],
        disagreements: [],
        failureConditions: [],
        recommendedChanges: [],
        localKnowledgeQuestions: [],
        limitations: [],
        evidenceRefs: ["S1"],
      },
      review_state: "reviewed",
      created_at: new Date("2026-07-13T10:00:00Z"),
      completed_at: new Date("2026-07-13T10:05:00Z"),
    });
    expect(mapped.result).toMatchObject({ missionType: "viability_tribunal", executiveSummary: "Legacy verdict" });
    expect(mapped.result?.missionType === "viability_tribunal" && mapped.result.rationale[0].citations[0].id).toBe("S1");
  });
});
