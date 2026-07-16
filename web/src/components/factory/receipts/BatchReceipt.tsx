"use client";

// Batch Receipt (parameters §6, ADR 0011). Summarises a presenter batch across
// its campaigns from event-derived per-campaign receipts. Incomplete and
// stopped campaigns are reported honestly alongside complete ones — never
// hidden, never rolled up into a fake success count.
//
// Grade language (15 Jul 2026): terminal rows speak the shared campaignGrade
// ladder over accepted sections; raw status words ("partial"/"failed") never
// render as user-facing labels. Failed runs read "Stopped early".

import { campaignGrade } from "@/lib/factory/documents";
import type { BatchReceipt as BatchReceiptData, CampaignReceipt } from "@/lib/factory/documents";
import "./receipts.css";

/** Receipts built by the gallery bridge carry the generated campaign name. */
type RowReceipt = CampaignReceipt & { campaignName?: string };

function rowStatus(c: CampaignReceipt): { label: string; tag: string } {
  switch (c.status) {
    case "queued":
      return { label: "Queued", tag: "gen" };
    case "running":
      return { label: "Building", tag: "gen" };
    case "failed":
      return { label: "Stopped early", tag: "ext" };
    case "cancelled":
      return { label: "Cancelled", tag: "ext" };
    default: {
      // completed | partial — graded by accepted sections (green/amber/grey, never red).
      const g = campaignGrade(c.sections.accepted, c.sections.total);
      return { label: g.label, tag: g.tone === "complete" ? "real" : g.tone === "nearly" ? "mock" : "ext" };
    }
  }
}

export function BatchReceipt({ batch }: { batch: BatchReceiptData }) {
  const { totals } = batch;
  return (
    <div className="fa-batch">
      <div className="fa-rcpt__head">
        <span className="fa-rcpt__title">Batch receipt</span>
        <span className="fa-mono">
          {batch.substantiallyUsable}/{batch.campaignCount} produced something usable
        </span>
      </div>

      <div className="fa-rcpt__stats fa-batch__stats">
        <div className="fa-rcpt__stat">
          <span className="fa-rcpt__big">{batch.campaignCount}</span>
          <span className="fa-rcpt__lbl">campaigns</span>
        </div>
        <div className="fa-rcpt__stat">
          <span className="fa-rcpt__big">{totals.agentsSpawned}</span>
          <span className="fa-rcpt__lbl">agents put to work</span>
        </div>
        <div className="fa-rcpt__stat">
          <span className="fa-rcpt__big">{totals.sourcesFetched}</span>
          <span className="fa-rcpt__lbl">sources fetched</span>
        </div>
        <div className="fa-rcpt__stat">
          <span className="fa-rcpt__big">{totals.documentsReady}</span>
          <span className="fa-rcpt__lbl">documents ready</span>
        </div>
      </div>

      <div className="fa-rcpt__meta">
        {totals.agentsFailed > 0 ? (
          <span className="fa-rcpt__flag">{totals.agentsFailed} agents failed</span>
        ) : null}
        {totals.terminalGaps > 0 ? (
          <span className="fa-rcpt__flag fa-rcpt__flag--gap">
            {totals.terminalGaps} item{totals.terminalGaps === 1 ? "" : "s"} not completed
          </span>
        ) : null}
        <span className="fa-rcpt__meta-item">
          {totals.sectionsAccepted} brief sections accepted across the batch
        </span>
      </div>

      <table className="fa-batch__table">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Status</th>
            <th>Sections</th>
            <th>Docs</th>
            <th>Gaps</th>
            <th aria-label="Open brief" />
          </tr>
        </thead>
        <tbody>
          {batch.campaigns.map((c: RowReceipt) => {
            const status = rowStatus(c);
            // Name flip: campaign name leads, place trails as the caption.
            const name = c.campaignName?.trim();
            return (
            <tr key={c.campaignId}>
              <td>
                <b>{name || c.place || c.problem || c.campaignId}</b>
                {name && c.place ? <span> · {c.place}</span> : null}
              </td>
              <td>
                <span className={`tag ${status.tag}`}>{status.label}</span>
              </td>
              <td className="fa-mono">
                {c.sections.accepted}/{c.sections.total}
              </td>
              <td className="fa-mono">
                {c.documents.ready}/{c.documents.total}
              </td>
              <td className="fa-mono">{c.terminalGaps}</td>
              <td>
                <a href={c.briefPath} target="_blank" rel="noopener noreferrer">
                  Open →
                </a>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
