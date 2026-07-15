// Campaign Completion Receipt — replaces a completed agent cluster. Summarises
// the finished campaign from event-derived counts and opens the full brief in a
// NEW tab (/factory/c/[id]). Honest about partial completion and terminal gaps.

import { ExternalLink, TriangleAlert } from "lucide-react";
import { hueByIndex } from "@/components/factory/cards";
import type { GalleryCampaign } from "./viewModel";

export function CampaignReceiptCard({ campaign }: { campaign: GalleryCampaign }) {
  const hue = hueByIndex(campaign.hue);
  const { run } = campaign;
  const agents = run.agents.length;
  const sources = run.agents.reduce((n, a) => n + a.sourceCount, 0);
  const accepted = Object.values(run.sections).filter((s) => s.status === "accepted").length;
  const docsReady = run.documents.filter((d) => d.status === "ready").length;
  const gaps = run.terminalGaps.length;
  const partial = run.status === "partial";

  return (
    <div
      style={{
        background: hue.anchorTint,
        border: `1px solid ${hue.anchorBorder}`,
        borderLeft: `3px solid ${hue.accent}`,
        borderRadius: 12,
        padding: "12px 14px",
        color: "#1b1d1e",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {partial ? "Brief partly ready" : "Campaign brief ready"}
        </span>
        {partial ? <TriangleAlert size={14} color="#a86a00" aria-hidden /> : null}
      </div>

      <div
        style={{
          marginTop: 8,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          rowGap: 4,
          columnGap: 10,
          fontSize: 12,
          color: "rgba(27,29,30,0.72)",
        }}
      >
        <span>{agents} agents</span>
        <span>{sources} sources</span>
        <span>{accepted}/10 sections</span>
        <span>{docsReady}/9 documents</span>
      </div>

      {gaps > 0 ? (
        <div style={{ marginTop: 6, fontSize: 11, color: "#a86a00" }}>
          {gaps} terminal gap{gaps === 1 ? "" : "s"} recorded
        </div>
      ) : null}

      <a
        href={`/factory/c/${encodeURIComponent(run.campaignId)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 10,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: "#fff",
          background: "#1b1d1e",
          borderRadius: 999,
          padding: "5px 12px",
          textDecoration: "none",
        }}
      >
        Open brief in new tab
        <ExternalLink size={13} />
      </a>
    </div>
  );
}
