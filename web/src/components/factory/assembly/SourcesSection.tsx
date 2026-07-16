"use client";

// Rung 11 — "Every source used" (original-brief redesign, 15 Jul 2026). The
// full source register in the legacy Sources-step pattern: one card per source
// with organisation, link and dates — but every entry is a collapsed <details>
// dropdown, grouped by evidence tier (A official records → D campaign voices,
// plain-English titles from language.ts). Honest by construction: the register
// lists what the research actually fetched; during a live run it grows as the
// AssemblyClient refreshes it, and nothing is shown that wasn't retrieved.

import { SOURCE_TIER_COPY } from "@/lib/factory/documents";
import type { SourceTier } from "@/lib/factory/contracts";
import { formatRegisterDate, type SourceRegisterEntry } from "./briefData";
import { SOURCES_COPY } from "./stepCopy";

const TIERS: SourceTier[] = ["A", "B", "C", "D"];

function SourceEntry({ s }: { s: SourceRegisterEntry }) {
  const published = formatRegisterDate(s.publishedAt);
  const accessed = formatRegisterDate(s.accessedAt);
  return (
    <details className="fa-src">
      <summary>
        <b>{s.title || s.organisation || "Source"}</b>
        {s.organisation && s.title !== s.organisation ? (
          <span className="fa-src__org">{s.organisation}</span>
        ) : null}
        <span className="fa-src__tier">Tier {s.tier}</span>
      </summary>
      <p className="src-meta">
        {s.url && s.url.startsWith("http") ? (
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            {s.url}
          </a>
        ) : (
          s.url
        )}
        {published ? <> · published {published}</> : null}
        {accessed ? <> · accessed {accessed}</> : null}
        <> · {SOURCE_TIER_COPY[s.tier].title.toLowerCase()}</>
      </p>
    </details>
  );
}

export function SourcesSection({
  id,
  stageKey,
  n,
  sources,
  terminal,
  active = false,
  revealed = true,
}: {
  id: string;
  stageKey: string;
  n: number;
  sources: SourceRegisterEntry[];
  terminal: boolean;
  active?: boolean;
  revealed?: boolean;
}) {
  return (
    <section
      className={`rung cf-reveal${active ? " active" : ""}`}
      id={id}
      data-stage={stageKey}
      data-on={revealed ? "1" : "0"}
    >
      <div className="jcontainer rung-grid">
        <aside>
          <div className="n">{n}</div>
          <h2>{SOURCES_COPY.title}</h2>
          <p className="whatsnew">{SOURCES_COPY.sub}</p>
          {SOURCES_COPY.limit ? <p className="limit">{SOURCES_COPY.limit}</p> : null}
        </aside>
        <div className="rc">
          {sources.length ? (
            <div data-anim="1">
              <p className="hint-sm">
                {`${sources.length} ${sources.length === 1 ? "source" : "sources"} checked & labelled${
                  terminal ? "" : " so far — the register grows as the research continues"
                }.`}
              </p>
              {TIERS.map((tier) => {
                const rows = sources.filter((s) => s.tier === tier);
                if (!rows.length) return null;
                const copy = SOURCE_TIER_COPY[tier];
                return (
                  <div key={tier}>
                    <h3>{copy.title}</h3>
                    <p className="hint-sm">{copy.caption}</p>
                    {rows.map((s) => (
                      <SourceEntry key={s.id} s={s} />
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="fa-skeleton__hint">
              {terminal
                ? "No sources were recorded for this campaign."
                : "Sources appear here as the research fetches them — the full register completes when the run finishes."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
