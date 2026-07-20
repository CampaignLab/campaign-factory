// Shared Brief Register load sequence for the public Campaign Brief route.
// Both the page's server component (first-paint register) and its refresh
// Server Function (fetchBriefRegister) read the same public rows and fold them
// into a BriefRegister. This is the one join; each caller keeps its own error
// contract (page → undefined, action → null) around it.

import {
  buildBriefRegister,
  campaignNameFromState,
  type BriefRegister,
} from "@/components/factory/assembly/briefData";
import { factorySql } from "@/lib/factory/store/client";
import { getClaims, getSources } from "@/lib/factory/store/evidence";
import { loadLatestState } from "@/lib/factory/store/state-versions";

export async function loadBriefRegister(campaignId: string): Promise<BriefRegister> {
  const sql = factorySql();
  const [sources, claims, state] = await Promise.all([
    getSources(sql, campaignId),
    getClaims(sql, campaignId),
    loadLatestState(sql, campaignId),
  ]);
  return buildBriefRegister(sources, claims, campaignNameFromState(state));
}
