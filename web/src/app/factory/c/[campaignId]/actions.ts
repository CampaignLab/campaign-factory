"use server";

// Refresh path for the Brief Register (original-brief redesign, 15 Jul 2026).
// The page's server component ships the register on first paint; a live brief
// calls this Server Function to keep the Sources rung and the claim rows
// growing with the run, and once more when the run turns terminal so the final
// register is complete without a reload. Public data only (same rows the
// public documents route compiles from); returns null on any failure so the
// client simply keeps what it has.

import {
  buildBriefRegister,
  campaignNameFromState,
  type BriefRegister,
} from "@/components/factory/assembly/briefData";
import { factorySql } from "@/lib/factory/store/client";
import { getClaims, getSources } from "@/lib/factory/store/evidence";
import { loadLatestState } from "@/lib/factory/store/state-versions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchBriefRegister(campaignId: string): Promise<BriefRegister | null> {
  if (!UUID_RE.test(campaignId)) return null;
  try {
    const sql = factorySql();
    const [sources, claims, state] = await Promise.all([
      getSources(sql, campaignId),
      getClaims(sql, campaignId),
      loadLatestState(sql, campaignId),
    ]);
    return buildBriefRegister(sources, claims, campaignNameFromState(state));
  } catch {
    return null;
  }
}
