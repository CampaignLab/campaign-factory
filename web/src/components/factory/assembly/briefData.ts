// The Brief Register (original-brief redesign, 15 Jul 2026). A small,
// serialisable slice of the evidence ledger that the Campaign Brief page needs
// beyond the event fold: the full source register (URLs, dates, tiers) for the
// Sources rung, and source-attributed claim rows for the "Key claims on the
// record" card on the evidence rung. Built SERVER-side (page.tsx / actions.ts)
// from the store's sources + claims and passed across the boundary as plain
// JSON; this module is pure and runtime-neutral so both sides import it alike.

import type { Claim, Source, SourceTier } from "@/lib/factory/contracts";

/** One row of the Sources rung register (everything the research read). */
export interface SourceRegisterEntry {
  id: string;
  url: string;
  title: string;
  organisation: string;
  publishedAt?: string; // ISO, absent when explicitly unknown
  accessedAt: string; // ISO
  tier: SourceTier;
}

/** One source-attributed claim row for the evidence rung's framed card. */
export interface ClaimRowVM {
  id: string;
  text: string;
  label: string; // canonical verification label (display translates it)
  loadBearing: boolean;
  /** Attribution for the row's leading column: the first linked source's
   *  organisation (falling back to its title), like the legacy claim rows. */
  sourceOrg?: string;
  sourceCount: number;
}

export interface BriefRegister {
  /** Generated campaign name from the accepted problem section, when it exists. */
  campaignName?: string;
  sources: SourceRegisterEntry[];
  claims: ClaimRowVM[];
}

export const EMPTY_BRIEF_REGISTER: BriefRegister = { sources: [], claims: [] };

/** The generated campaign name rides in the accepted problem section's content
 *  (problemSchema.campaignName, state/sections.ts). Absent until it lands. */
export function campaignNameFromState(state: unknown): string | undefined {
  if (!state || typeof state !== "object") return undefined;
  const sections = (state as { sections?: Record<string, { content?: unknown }> }).sections;
  const content = sections?.problem?.content;
  if (!content || typeof content !== "object") return undefined;
  const name = (content as Record<string, unknown>)["campaignName"];
  return typeof name === "string" && name.trim() ? name.trim() : undefined;
}

const TIER_ORDER: Record<SourceTier, number> = { A: 0, B: 1, C: 2, D: 3 };

/** Pure join: store rows → the register the brief renders. Deterministic. */
export function buildBriefRegister(
  sources: Source[],
  claims: Claim[],
  campaignName?: string,
): BriefRegister {
  const byId = new Map(sources.map((s) => [s.id, s]));
  return {
    campaignName: campaignName?.trim() || undefined,
    sources: [...sources]
      .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.title.localeCompare(b.title))
      .map((s) => ({
        id: s.id,
        url: s.url,
        title: s.title,
        organisation: s.organisation,
        publishedAt: s.publishedAt,
        accessedAt: s.accessedAt,
        tier: s.tier,
      })),
    claims: claims.map((c) => {
      const first = (c.sourceIds ?? []).map((id) => byId.get(id)).find(Boolean);
      return {
        id: c.id,
        text: c.text,
        label: c.status,
        loadBearing: c.loadBearing,
        sourceOrg: first ? first.organisation || first.title || undefined : undefined,
        sourceCount: c.sourceIds?.length ?? 0,
      };
    }),
  };
}

/** Fixed-format date for register rows ("12 Jan 2026") — locale-independent so
 *  server and client render identical HTML (no hydration drift). */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatRegisterDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return undefined;
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
}
