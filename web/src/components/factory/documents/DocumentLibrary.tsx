"use client";

// The nine-document library (ADR 0007), restored to the legacy "Campaign
// materials" presentation (Journey stage 11). Every BUILT document is a legacy
// .doccard: "Document N of M" eyebrow, title, its graded status pill (honesty
// label stays), a ~150-char preview of the body, and two actions — "⧉ Copy"
// (full plain text to the clipboard) and "↓ Word" (the existing Word-.doc
// export util). Contentless documents keep the user-approved pastel
// "Coming soon" cards, untouched.
//
// The FULL document bodies scroll by inside their owning production steps
// (AssemblyView/BriefSection) as legacy draftblocks — this grid is the library
// index only. Presentational: the compiled documents come from W6's pure
// compileDocuments(state, claims).

import type { CompiledDocument } from "@/lib/factory/documents";
import { documentPill } from "@/lib/factory/documents";
import type { DocumentStatus } from "@/lib/factory/contracts";
import { downloadDocHtml, copyText } from "./wordExport";
import "./documents.css";

const PILL_TAG: Record<"complete" | "nearly", string> = { complete: "real", nearly: "mock" };

// Rotating pastel tints for the "Coming soon" (contentless) cards — the brief's
// blue / pink / yellow palette family, so placeholders read as design.
const SOON_TINTS = ["t-b", "t-p", "t-y"] as const;

function Pill({ status, flagged }: { status: DocumentStatus; flagged: boolean }) {
  const pill = documentPill(status, flagged);
  if (!pill) return null;
  return (
    <span className={`tag ${PILL_TAG[pill.tone]}`} title={status}>
      {pill.label}
    </span>
  );
}

export function DocumentLibrary({
  documents,
  title = "Campaign documents",
  intro,
  showHeading = true,
}: {
  documents: CompiledDocument[];
  title?: string;
  intro?: string;
  /** Drop the "Campaign documents" heading when the surrounding surface already
   *  provides it (e.g. the brief's step-10 aside) — the ready count stays. */
  showHeading?: boolean;
}) {
  const readyCount = documents.filter((d) => d.status === "ready").length;
  // deterministic tint per contentless doc (rotates across only the soon cards)
  const soonTint = new Map<string, string>();
  documents
    .filter((d) => documentPill(d.status, d.flags.length > 0) == null)
    .forEach((d, i) => soonTint.set(d.key, SOON_TINTS[i % SOON_TINTS.length]));

  return (
    <div className="fa-doclib">
      <div className="fa-doclib__head">
        {showHeading ? <h3>{title}</h3> : null}
        <span className="fa-doclib__count">
          <b>{readyCount}</b> of {documents.length} ready to use
        </span>
      </div>
      {intro ? <p className="hint-sm">{intro}</p> : null}

      <div className="docgrid" style={{ marginTop: "0.75rem" }}>
        {documents.map((d) => {
          const built = documentPill(d.status, d.flags.length > 0) != null;
          // Contentless documents are non-clickable "Coming soon" pastel cards
          // (never a dead-end empty view) — preserved exactly.
          if (!built) {
            return (
              <div key={d.key} className={`doccard fa-doccard fa-doccard--soon ${soonTint.get(d.key) ?? ""}`}>
                <span className="d-n">
                  Document {d.num} of {documents.length}
                  {d.isPack ? " · pack" : ""}
                </span>
                <h3>{d.name}</h3>
                <div className="d-prev">
                  <span className="fa-soon-pill">Coming soon</span>
                </div>
              </div>
            );
          }
          // Built documents: the legacy doccard — preview + Copy + Word, with the
          // graded status pill kept as the honesty label.
          return (
            <div key={d.key} className="doccard">
              <span className="d-n">
                Document {d.num} of {documents.length}
                {d.isPack ? " · pack" : ""}
              </span>
              <h3>{d.name}</h3>
              <Pill status={d.status} flagged={d.flags.length > 0} />
              <div className="d-prev">{d.plainText.slice(0, 150)}…</div>
              <div className="dd-actions">
                <button type="button" className="toolbtn" onClick={() => copyText(d.plainText)}>
                  ⧉ Copy
                </button>
                <button type="button" className="toolbtn" onClick={() => downloadDocHtml(d.name, d.html)}>
                  ↓ Word
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
