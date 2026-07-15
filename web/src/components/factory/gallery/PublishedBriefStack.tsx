"use client";

// Published brief pieces — the campaign's OUTPUT assembling in real time.
// One persistent paper-styled card per accepted/applied section (fold
// PublishedCardVM). These are artefacts, not agents: light document surfaces
// against the dark agent chrome, so the audience watches the brief physically
// stack up while the agent cards churn above pill collapse and receipts.
// The most recently published piece stays expanded; older pieces compress to
// title rows and toggle open on click. Never pill-collapses, never removed.

import { useState } from "react";
import { hueByIndex } from "@/components/factory/cards";
import type { CampaignHueIndex } from "@/components/factory/cards";
import type { PublishedCardVM } from "@/lib/factory/client/fold";
import { JOURNEY_STEPS } from "@/lib/factory/contracts";
import styles from "./gallery.module.css";

export function PublishedBriefStack({
  cards,
  hue,
}: {
  cards: PublishedCardVM[];
  hue: CampaignHueIndex;
}) {
  const h = hueByIndex(hue);
  // Manual open/closed overrides; the default is "newest expanded, rest titles".
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  if (cards.length === 0) return null;

  let newest = cards[0];
  for (const c of cards) {
    if (c.sequence > newest.sequence || (c.sequence === newest.sequence && c.at > newest.at)) {
      newest = c;
    }
  }

  const isExpanded = (c: PublishedCardVM) => overrides[c.key] ?? c.key === newest.key;
  const toggle = (c: PublishedCardVM) =>
    setOverrides((prev) => ({ ...prev, [c.key]: !isExpanded(c) }));

  return (
    <div className={styles.briefStack} aria-label="Published brief sections">
      <div className={styles.briefStackHead}>
        <span className={styles.briefStackTitle}>Campaign brief</span>
        <span className={styles.briefStackCount}>
          {cards.length}/{JOURNEY_STEPS.length} published
        </span>
      </div>
      {cards.map((c) => {
        const expanded = isExpanded(c);
        return (
          <div
            key={c.key}
            className={styles.briefCard}
            style={{ borderLeft: `3px solid ${h.edgeGlowless}` }}
          >
            <button
              type="button"
              className={styles.briefCardHead}
              onClick={() => toggle(c)}
              aria-expanded={expanded}
              title={expanded ? "Collapse section" : "Expand section"}
            >
              <span className={styles.briefCardStep}>§{c.step}</span>
              <span
                className={styles.briefCardTitle}
                style={expanded ? { whiteSpace: "normal" } : undefined}
              >
                {c.title}
              </span>
            </button>
            {expanded && c.excerpt ? (
              <p className={styles.briefCardExcerpt}>{c.excerpt}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
