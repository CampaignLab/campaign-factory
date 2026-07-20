// Public Campaign Brief route (W4). Server component: unwrap the async params
// (Next 16 — params is a Promise), then hand off to the live client container.
// The brief opens immediately and the client attaches the SSE/polling stream;
// the body stays events-only and client-folded. The server contributes three
// small reads so a SHARED link renders honestly on first paint:
//   - the run header (problem/place hero echo),
//   - the latest accepted state (the generated campaign name — the hero title
//     once it exists; name flip, 15 Jul 2026 decision),
//   - the evidence ledger's source register + claims (the Sources rung and the
//     evidence rung's "Key claims on the record" card).
// generateMetadata titles the tab with the same campaign name, falling back to
// the user's problem text while no name exists yet.

import type { Metadata } from "next";
import { AssemblyClient } from "@/components/factory/assembly/AssemblyClient";
import {
  campaignNameFromState,
  type BriefRegister,
} from "@/components/factory/assembly/briefData";
import { isUuidId } from "@/lib/factory/ids";
import { factorySql } from "@/lib/factory/store/client";
import { getRun } from "@/lib/factory/store/runs";
import { loadLatestState } from "@/lib/factory/store/state-versions";
import { loadBriefRegister } from "./briefRegister";

function truncate(s: string, cap: number): string {
  const t = s.trim();
  return t.length <= cap ? t : `${t.slice(0, cap - 1).trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}): Promise<Metadata> {
  const { campaignId } = await params;
  if (isUuidId(campaignId)) {
    try {
      const sql = factorySql();
      const [run, state] = await Promise.all([
        getRun(sql, campaignId),
        loadLatestState(sql, campaignId).catch(() => null),
      ]);
      // Name flip: the factory-generated campaign name titles the tab; the
      // user's problem text is the honest fallback while no name exists yet.
      const name = campaignNameFromState(state) || (run?.problem ? truncate(run.problem, 60) : undefined);
      if (name) {
        return {
          title: `${name} · Campaign brief`,
          description: run?.problem || undefined,
        };
      }
    } catch {
      // metadata must never break the page (db unreachable, etc.)
    }
  }
  return { title: "Campaign brief" };
}

export default async function CampaignAssemblyPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  // Small header + register reads so a SHARED link renders an honest hero and
  // source register even when the stored event log carries no run.started
  // detail. The section content stays events-only and client-folded; every
  // read fails soft so the client can still render from events alone.
  let problem: string | undefined;
  let place: string | undefined;
  let register: BriefRegister | undefined;
  if (isUuidId(campaignId)) {
    const sql = factorySql();
    try {
      const run = await getRun(sql, campaignId);
      problem = run?.problem || undefined;
      place = run?.place || undefined;
    } catch {
      // db unreachable — the client still renders from events/seedless
    }
    try {
      register = await loadBriefRegister(campaignId);
    } catch {
      // register unavailable — the rungs render their honest empty states
    }
  }
  return (
    <AssemblyClient campaignId={campaignId} problem={problem} place={place} register={register} />
  );
}
