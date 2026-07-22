import type { Metadata } from "next";
import Link from "next/link";
import { listWall } from "@/lib/db/wall";
import { getRunSectionCounts, listFinishedPresenterRuns, listFinishedPublicRuns } from "@/lib/factory/store/runs";
import type { RunRecord } from "@/lib/factory/store/runs";
import { factoryReadSql } from "@/app/api/factory/_lib/worker";
import { campaignGrade } from "@/lib/factory/documents/language";
import { campaignKey, composeGallery, gradeRank } from "./compose";
import type { GalleryCard, PillTone } from "./compose";

export const metadata: Metadata = {
  title: "Campaign Gallery · Campaign Factory",
  description:
    "Finished campaign briefs built by the agent factory — open any card to read the full brief.",
};

export const dynamic = "force-dynamic";

// Shared status language: green = complete, amber = nearly complete, grey =
// legacy single-agent. Nothing red ever appears on the public wall — lower
// grades are hidden entirely, not badged.
const PILL_STYLES: Record<PillTone, string> = {
  complete: "border-emerald-300 bg-emerald-100 text-emerald-900",
  nearly: "border-amber-300 bg-amber-100 text-amber-900",
  legacy: "text-muted-foreground",
};

// Finished presenter-batch campaigns shown as individual cards — ONE card per
// unique campaign (the test batches re-ran the same briefs many times).
// Section counts + the generated campaign name come from the latest accepted
// state in one batched query; the grade ladder lives in documents/language.ts
// and is NOT redefined here. Name flip (user decision, 15 Jul 2026): the
// campaign NAME is the card title (fallback: the problem text) and the place
// is the caption. Agent factory config may be absent in a legacy-only
// environment — degrade to the shared list rather than failing the page.
async function factoryCards(): Promise<GalleryCard[]> {
  const environmentId = process.env.FACTORY_ENV_ID;
  if (!environmentId) return [];
  try {
    const sql = factoryReadSql();
    const runs = await listFinishedPresenterRuns(sql, environmentId);
    const counts = await getRunSectionCounts(
      sql,
      runs.map((r) => r.campaignId),
    );
    const gradeOf = (r: RunRecord) => {
      const c = counts.get(r.campaignId);
      return c ? campaignGrade(c.acceptedSections, c.totalSections) : null;
    };
    // A run without a completion receipt cannot be graded honestly: rank it
    // below every graded run and never give it a card. The grade ladder is the
    // shared gradeRank table in ./compose (unified with the cross-section
    // comparator's ranking); an absent/off-ladder tone ranks below all.
    const rankOf = (r: RunRecord) => gradeRank(gradeOf(r)?.tone);

    // Best-grade run per unique campaign; most recent finish breaks ties.
    const best = new Map<string, RunRecord>();
    for (const r of runs) {
      const key = campaignKey(r.problem, r.place);
      const prev = best.get(key);
      if (!prev) {
        best.set(key, r);
        continue;
      }
      const newer =
        (r.completedAt ?? r.updatedAt).localeCompare(prev.completedAt ?? prev.updatedAt) > 0;
      if (rankOf(r) > rankOf(prev) || (rankOf(r) === rankOf(prev) && newer)) best.set(key, r);
    }

    const cards: GalleryCard[] = [];
    for (const r of best.values()) {
      const grade = gradeOf(r);
      // Only fully COMPLETE campaigns earn a public card (user, 16 Jul —
      // "drop the ones that are not fully complete"). Nearly-complete and
      // lower are hidden entirely, never badged.
      if (!grade || grade.tone !== "complete") continue;
      const info = counts.get(r.campaignId);
      const name = info?.campaignName?.trim();
      // Caption: the place, plus the campaign's short ask when it stays scannable.
      const ask = info?.ask?.trim();
      const caption = r.place && ask && ask.length <= 80 ? `${r.place} — ${ask}` : r.place || null;
      cards.push({
        key: r.campaignId,
        href: `/factory/c/${r.campaignId}`,
        title: name || r.problem,
        subtitle: caption,
        pill: { label: grade.label, tone: grade.tone },
        sortKey: r.completedAt ?? r.updatedAt,
        campaignKey: campaignKey(r.problem, r.place),
        source: "presenter",
      });
    }
    return cards;
  } catch {
    return [];
  }
}

// Finished public self-serve campaigns — the audience-built runs. Same card
// shape, grade gate (only Complete / Nearly earn a card) and grading pills as
// the presenter cards; auto-shared, so no opt-in flag. Carries campaignKey +
// source so composition can dedupe them against presenter runs and split the
// organizers' pre-session testing out by cutoff. Degrades to [] if config is absent.
async function soloCards(): Promise<GalleryCard[]> {
  const environmentId = process.env.FACTORY_ENV_ID;
  if (!environmentId) return [];
  try {
    const sql = factoryReadSql();
    const runs = await listFinishedPublicRuns(sql, environmentId);
    const counts = await getRunSectionCounts(
      sql,
      runs.map((r) => r.campaignId),
    );
    const cards: GalleryCard[] = [];
    for (const r of runs) {
      const c = counts.get(r.campaignId);
      const grade = c ? campaignGrade(c.acceptedSections, c.totalSections) : null;
      // Only fully COMPLETE campaigns earn a public card (user, 16 Jul —
      // "drop the ones that are not fully complete"). Nearly-complete and
      // lower are hidden entirely, never badged.
      if (!grade || grade.tone !== "complete") continue;
      const name = c?.campaignName?.trim();
      const ask = c?.ask?.trim();
      const caption = r.place && ask && ask.length <= 80 ? `${r.place} — ${ask}` : r.place || null;
      cards.push({
        key: r.campaignId,
        href: `/factory/c/${r.campaignId}`,
        title: name || r.problem,
        subtitle: caption,
        pill: { label: grade.label, tone: grade.tone },
        sortKey: r.completedAt ?? r.updatedAt,
        campaignKey: campaignKey(r.problem, r.place),
        source: "solo",
      });
    }
    return cards;
  } catch {
    return [];
  }
}

// Opt-in campaigns from the single-agent builder, marked with a legacy pill.
async function legacyCards(): Promise<GalleryCard[]> {
  const items = await listWall().catch(() => []);
  return items.map((it) => ({
    key: it.id,
    href: `/c/${it.id}`,
    title: it.title || it.name,
    subtitle: it.title && it.title !== it.name ? it.name : null,
    pill: { label: "Legacy · single-agent", tone: "legacy" as const },
    sortKey: it.updatedAt,
  }));
}

// One responsive grid of cards — shared by both gallery sections.
function CardGrid({ cards }: { cards: GalleryCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Link
          key={c.key}
          href={c.href}
          className="group rounded-[var(--r-2xl)] border bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors hover:border-brand"
        >
          <div className="line-clamp-3 text-lg font-medium leading-snug transition-colors group-hover:text-brand">
            {c.title}
          </div>
          {c.subtitle ? <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.subtitle}</div> : null}
          <div className="mt-3 flex gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${PILL_STYLES[c.pill.tone]}`}>
              {c.pill.label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function GalleryPage() {
  const [factory, solo, legacy] = await Promise.all([factoryCards(), soloCards(), legacyCards()]);
  const { organizerCards, audienceCards } = composeGallery(factory, solo, legacy);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">Agent Factory</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            Campaign <span className="font-serif font-normal italic">Gallery</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Campaigns built on stage by the agent factory, and earlier ones people chose to share.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/factory" className="rounded-full bg-foreground px-4 py-1.5 text-background transition-colors hover:bg-foreground/85">
            Make your own
          </Link>
        </div>
      </header>

      {organizerCards.length === 0 && audienceCards.length === 0 ? (
        <p className="text-muted-foreground">Nothing here yet — be the first.</p>
      ) : (
        <div className="space-y-12">
          {organizerCards.length > 0 ? (
            <section>
              <h2 className="mb-4 text-xl font-medium tracking-tight sm:text-2xl">
                {"From the organizers' agent factory"}
              </h2>
              <CardGrid cards={organizerCards} />
            </section>
          ) : null}
          {audienceCards.length > 0 ? (
            <section>
              <h2 className="mb-4 text-xl font-medium tracking-tight sm:text-2xl">From the audience</h2>
              <CardGrid cards={audienceCards} />
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
