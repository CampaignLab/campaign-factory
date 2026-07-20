"use server";

// Refresh path for the Brief Register (original-brief redesign, 15 Jul 2026).
// The page's server component ships the register on first paint; a live brief
// calls this Server Function to keep the Sources rung and the claim rows
// growing with the run, and once more when the run turns terminal so the final
// register is complete without a reload. Public data only (same rows the
// public documents route compiles from); returns null on any failure so the
// client simply keeps what it has.

import { type BriefRegister } from "@/components/factory/assembly/briefData";
import { isUuidId } from "@/lib/factory/ids";
import { loadBriefRegister } from "./briefRegister";

export async function fetchBriefRegister(campaignId: string): Promise<BriefRegister | null> {
  if (!isUuidId(campaignId)) return null;
  try {
    return await loadBriefRegister(campaignId);
  } catch {
    return null;
  }
}
