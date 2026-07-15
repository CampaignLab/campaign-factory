// Expansion-priority selection (W5), pure and deterministic given `now`.
// Rules (parameters §6 / task):
//  - at most 10 expanded cards across the whole gallery;
//  - priority to failing → awaiting-review → handing-off → running → queued,
//    then most-recently-spawned;
//  - ≤3 expanded per campaign while ≥2 campaigns are active (relaxed when only
//    one campaign is still working);
//  - a completed agent stays readable ~1000ms (within 800–1200ms) then pills.

import { UI_LIMITS } from "@/lib/factory/contracts";
import type { AgentCardVM, CardPresentation } from "@/components/factory/cards";

// Readable window before a completed card collapses to an identity pill.
export const COMPLETION_READABLE_MS = 1000;

const TERMINAL = new Set(["complete", "partial", "failed"]);

function isPillReady(a: AgentCardVM, now: number): boolean {
  if (!TERMINAL.has(a.status)) return false;
  if (!a.completedAt) return true; // terminal with no stamp → treat as already collapsed
  return now - Date.parse(a.completedAt) >= COMPLETION_READABLE_MS;
}

function priorityScore(a: AgentCardVM): number {
  if (a.status === "failed") return 100;
  if (a.status === "partial") return 85;
  if (a.isAwaitingReview) return 80;
  if (a.isHandingOff) return 70;
  if (a.status === "running") return 40;
  if (a.status === "complete") return 30; // still inside the readable window
  if (a.status === "queued") return 20;
  return 0;
}

export interface PresentationOptions {
  now: number;
  maxExpanded?: number;
  perCampaignCap?: number;
}

/** Decide expanded / compact / pill for every card in the gallery. */
export function selectPresentation(
  cards: AgentCardVM[],
  opts: PresentationOptions,
): Map<string, CardPresentation> {
  const { now } = opts;
  const maxExpanded = opts.maxExpanded ?? UI_LIMITS.maxExpandedCards;
  const perCampaignCap = opts.perCampaignCap ?? UI_LIMITS.maxExpandedCardsPerCampaignInBatch;
  const result = new Map<string, CardPresentation>();

  const nonPill: AgentCardVM[] = [];
  for (const c of cards) {
    if (isPillReady(c, now)) result.set(c.agentRunId, "pill");
    else nonPill.push(c);
  }

  const activeCampaigns = new Set(nonPill.map((c) => c.campaignId));
  const applyPerCampaignCap = activeCampaigns.size >= 2;

  const ranked = [...nonPill].sort((x, y) => {
    const ps = priorityScore(y) - priorityScore(x);
    if (ps !== 0) return ps;
    if (y.spawnSequence !== x.spawnSequence) return y.spawnSequence - x.spawnSequence;
    return Date.parse(y.lastEventAt) - Date.parse(x.lastEventAt);
  });

  const perCampaign = new Map<string, number>();
  let expandedTotal = 0;
  for (const c of ranked) {
    const used = perCampaign.get(c.campaignId) ?? 0;
    const campaignOk = !applyPerCampaignCap || used < perCampaignCap;
    if (expandedTotal < maxExpanded && campaignOk) {
      result.set(c.agentRunId, "expanded");
      perCampaign.set(c.campaignId, used + 1);
      expandedTotal += 1;
    } else {
      result.set(c.agentRunId, "compact");
    }
  }
  return result;
}
