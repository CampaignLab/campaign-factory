// Opaque Campaign Card — a fixed anchor for one campaign. Stays legible from
// the back of the room: light, opaque, hue-tinted, large short name. This is
// the calm layer the dense agent overlay must never hide.

import { X } from "lucide-react";
import { JOURNEY_STEPS, type RunStatus } from "@/lib/factory/contracts";
import { campaignGrade } from "@/lib/factory/documents";
import { hueByIndex } from "@/components/factory/cards";
import styles from "./gallery.module.css";
import type { GalleryCampaign } from "./viewModel";

// Nine acceptable sections: the compiled "documents" step is never counted
// (same denominator as campaignGrade everywhere else).
const ACCEPTABLE_TOTAL = JOURNEY_STEPS.filter((s) => s.key !== "documents").length;

// Terminal states speak the shared campaignGrade ladder (documents/language.ts)
// — raw status words like "partial"/"failed" never render as user-facing
// labels, and recorded runs get the same graded wording as live ones.
function statusLabel(status: RunStatus, sectionsAccepted: number): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Building";
    case "failed":
      return "Stopped early";
    case "cancelled":
      return "Cancelled";
    default:
      // completed | partial → graded by accepted sections, never echoed status
      return campaignGrade(sectionsAccepted, ACCEPTABLE_TOTAL).label;
  }
}

export function CampaignAnchor({
  campaign,
  activeAgents,
  sectionsAccepted,
  onCancel,
}: {
  campaign: GalleryCampaign;
  activeAgents: number;
  sectionsAccepted: number;
  onCancel?: (campaignId: string) => void; // presenter-only, visually quiet
}) {
  const hue = hueByIndex(campaign.hue);
  const { run } = campaign;
  const canCancel = onCancel && (run.status === "running" || run.status === "queued");
  // Name flip (15 Jul 2026): once the problem section lands the generated
  // campaign name is the anchor title (untruncated — CSS ellipsis handles
  // overflow) and the place becomes the small caption. Before that, current
  // behavior: place-derived short name over the problem text.
  const campaignName = run.campaignName?.trim();
  const caption = campaignName ? run.place : run.problem;

  return (
    <div
      className={styles.anchor}
      style={{
        background: hue.anchorTint,
        border: `1px solid ${hue.anchorBorder}`,
        borderRadius: 12,
        padding: "10px 12px",
        color: "#1b1d1e",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: hue.accent, flexShrink: 0 }} />
        <span
          style={{
            // Scales with the floor density (phone / desktop / projector).
            fontSize: "var(--cf-anchor-title, 17px)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={campaignName || run.place}
        >
          {campaignName || campaign.shortName}
        </span>
        <span
          style={{
            fontSize: "var(--cf-anchor-status, 10px)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "rgba(27,29,30,0.55)",
            flexShrink: 0,
          }}
        >
          {statusLabel(run.status, sectionsAccepted)}
        </span>
        {canCancel ? (
          <button
            type="button"
            aria-label={`Cancel ${campaign.shortName}`}
            title="Cancel this campaign"
            onClick={() => onCancel?.(run.campaignId)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              borderRadius: 999,
              border: "1px solid rgba(27,29,30,0.18)",
              background: "transparent",
              color: "rgba(27,29,30,0.5)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={11} />
          </button>
        ) : null}
      </div>

      {caption ? (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "var(--cf-anchor-sub, 12px)",
            lineHeight: 1.35,
            color: "rgba(27,29,30,0.7)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {caption}
        </p>
      ) : null}

      <div
        style={{
          marginTop: 7,
          display: "flex",
          gap: 12,
          fontSize: "var(--cf-anchor-meta, 11px)",
          color: "rgba(27,29,30,0.6)",
        }}
      >
        <span>{activeAgents} working</span>
        <span>{sectionsAccepted}/{ACCEPTABLE_TOTAL} accepted</span>
      </div>
    </div>
  );
}
