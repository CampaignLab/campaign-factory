"use client";

// Campaign Completion Receipt (parameters §6, ADR 0011). Replaces a completed
// agent cluster in the Factory Gallery and also heads the completed campaign
// page. Every figure comes from W6's event-derived buildCampaignReceipt — no
// fabricated counts. Honest about incomplete work and terminal gaps. The
// full Campaign Brief opens in a NEW tab.
//
// Grade language (15 Jul 2026): every user-facing grade label derives from the
// shared campaignGrade ladder over accepted sections — never from recorded
// summaries or raw status words ("partial"/"failed" never render).

import { campaignGrade } from "@/lib/factory/documents";
import type { CampaignReceipt } from "@/lib/factory/documents";
import "./receipts.css";

function fmtElapsed(ms?: number): string | null {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Grade = ReturnType<typeof campaignGrade>;

// campaignGrade tone → the shared .tag palette (green / amber / grey — never red).
const GRADE_TAG: Record<Grade["tone"], string> = {
  complete: "real",
  nearly: "mock",
  neutral: "ext",
};

function headline(status: CampaignReceipt["status"], grade: Grade): string {
  switch (status) {
    case "queued":
      return "Campaign queued";
    case "running":
      return "Campaign in progress";
    case "failed":
      return "Stopped early — finished work kept";
    case "cancelled":
      return "Run cancelled — finished work kept";
    default:
      // completed | partial — graded by accepted sections, not echoed status.
      if (grade.tone === "complete") return "Campaign brief ready";
      if (grade.tone === "nearly") return "Campaign brief nearly complete";
      return `Campaign brief — ${grade.label.toLowerCase()}`;
  }
}

export function CampaignCompletionReceipt({
  receipt,
  accent,
  compact = false,
  briefUrl,
}: {
  /** W6 receipt; the gallery bridge adds the generated campaign name (name flip). */
  receipt: CampaignReceipt & { campaignName?: string };
  /** optional campaign hue accent for the left edge (gallery) */
  accent?: string;
  /** compact = the gallery cluster-replacement size */
  compact?: boolean;
  /** override the brief link (defaults to receipt.briefPath) */
  briefUrl?: string;
}) {
  const elapsed = fmtElapsed(receipt.elapsedMs);
  const incomplete =
    receipt.status === "partial" || receipt.status === "failed" || receipt.status === "cancelled";
  const href = briefUrl ?? receipt.briefPath;
  const grade = campaignGrade(receipt.sections.accepted, receipt.sections.total);
  const campaignName = receipt.campaignName?.trim();

  const tiles: Array<[number | string, string]> = [
    [receipt.agents.spawned, receipt.agents.spawned === 1 ? "agent" : "agents"],
    [receipt.sourcesFetched, receipt.sourcesFetched === 1 ? "source" : "sources"],
    [`${receipt.sections.accepted}/${receipt.sections.total}`, "sections accepted"],
    [`${receipt.documents.ready}/${receipt.documents.total}`, "documents ready"],
  ];

  return (
    <div
      className={`fa-rcpt${compact ? " fa-rcpt--compact" : ""}${incomplete ? " fa-rcpt--partial" : ""}`}
      style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
    >
      <div className="fa-rcpt__head">
        <span className="fa-rcpt__title">{headline(receipt.status, grade)}</span>
        <span className={`tag ${GRADE_TAG[grade.tone]}`}>{grade.label}</span>
      </div>

      {/* Name flip: the generated campaign name leads; the place is the caption.
          Without a name (older recordings), current behavior: place · problem. */}
      {campaignName ? (
        <p className="fa-rcpt__sub">
          <b>{campaignName}</b>
          {receipt.place ? " · " : null}
          {receipt.place ? <span>{receipt.place}</span> : null}
        </p>
      ) : receipt.place || receipt.problem ? (
        <p className="fa-rcpt__sub">
          {receipt.place ? <b>{receipt.place}</b> : null}
          {receipt.place && receipt.problem ? " · " : null}
          {receipt.problem ? <span>{receipt.problem}</span> : null}
        </p>
      ) : null}

      <div className="fa-rcpt__stats">
        {tiles.map(([big, label], i) => (
          <div key={i} className="fa-rcpt__stat">
            <span className="fa-rcpt__big">{big}</span>
            <span className="fa-rcpt__lbl">{label}</span>
          </div>
        ))}
      </div>

      <div className="fa-rcpt__meta">
        {receipt.agents.failed > 0 ? (
          <span className="fa-rcpt__flag">
            {receipt.agents.failed} agent{receipt.agents.failed === 1 ? "" : "s"} failed
          </span>
        ) : null}
        {receipt.documents.needsVerification > 0 ? (
          <span className="fa-rcpt__flag">
            {receipt.documents.needsVerification} doc
            {receipt.documents.needsVerification === 1 ? "" : "s"} to check before use
          </span>
        ) : null}
        {receipt.terminalGaps > 0 ? (
          <span className="fa-rcpt__flag fa-rcpt__flag--gap">
            {receipt.terminalGaps} item{receipt.terminalGaps === 1 ? "" : "s"} not completed in this run
          </span>
        ) : null}
        {receipt.judgements.requested > 0 ? (
          <span className="fa-rcpt__meta-item fa-mono">
            {receipt.judgements.resolved + receipt.judgements.defaulted}/{receipt.judgements.requested}{" "}
            choices settled
          </span>
        ) : null}
        {elapsed ? <span className="fa-rcpt__meta-item fa-mono">{elapsed} elapsed</span> : null}
      </div>

      <a className="fa-rcpt__open" href={href} target="_blank" rel="noopener noreferrer">
        Open brief in new tab →
      </a>
    </div>
  );
}
