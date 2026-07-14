import { type Campaign, type SourceClaim } from "@/lib/pipeline/types";

export interface EvidenceInventoryItem {
  itemId: string;
  kind: "source_claim" | "lint_item";
  claim: string;
  originalLabel: string;
  originalEvidence: string;
  source?: SourceClaim;
  recheck: boolean;
}

const RECHECK_LIMIT = 24;

function claimPriority(item: Omit<EvidenceInventoryItem, "recheck">): number {
  if (item.kind === "lint_item" && item.originalLabel === "block") return 0;
  if (["Conflicting evidence", "Verification incomplete", "External information unavailable"].includes(item.originalLabel)) return 1;
  if (item.kind === "lint_item") return 2;
  if (item.originalLabel === "Campaign assumption") return 3;
  return 4;
}

export function buildEvidenceInventory(campaign: Campaign): EvidenceInventoryItem[] {
  const items: Omit<EvidenceInventoryItem, "recheck">[] = [
    ...campaign.sources.map((source, index) => ({
      itemId: `S${index + 1}`,
      kind: "source_claim" as const,
      claim: source.claim,
      originalLabel: source.status,
      originalEvidence: source.evidence,
      source,
    })),
    ...(campaign.lint?.flags || []).map((flag, index) => ({
      itemId: `L${index + 1}`,
      kind: "lint_item" as const,
      claim: `${flag.document}: ${flag.issue}`,
      originalLabel: flag.severity,
      originalEvidence: "Unresolved campaign lint item",
    })),
  ];

  const selected = new Set(
    items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => claimPriority(a.item) - claimPriority(b.item) || a.index - b.index)
      .slice(0, RECHECK_LIMIT)
      .map(({ item }) => item.itemId),
  );

  return items.map((item) => ({ ...item, recheck: selected.has(item.itemId) }));
}

export const EVIDENCE_RECHECK_LIMIT = RECHECK_LIMIT;
