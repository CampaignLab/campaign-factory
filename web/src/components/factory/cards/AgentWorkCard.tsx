// Expanded Agent Work Card (~300×190). The six regions (parameters §6):
//   1 agent identity pill + campaign identity
//   2 bounded assignment in one line
//   3 dense Work Backscroll (6–10 semantic events visible, scrolls)
//   4 current source / tool / handoff state
//   5 latest useful finding or uncertainty
//   6 proposal / review status + elapsed
// Never token counts, hidden prompts, private reasoning, raw JSON, or stack
// traces. Monospace only for stamps, verbs, and the elapsed clock.

import { createElement } from "react";
import { Radio, ArrowRightLeft, FileSearch, ScrollText, Clock } from "lucide-react";
import { hueByIndex } from "./hues";
import { AgentIcon } from "./icons";
import { INK, EXPANDED, mono, statusDot } from "./chrome";
import { clockStamp, elapsedClock } from "./format";
import styles from "./factory.module.css";
import type { AgentCardProps, CardActivity, CardProposalState } from "./types";

const MAX_ROWS = 12; // window the tail; VM may hold more (virtualised upstream)

function activityIcon(kind: CardActivity["kind"]) {
  switch (kind) {
    case "source":
      return FileSearch;
    case "handoff":
      return ArrowRightLeft;
    case "review":
      return ScrollText;
    case "analysis":
      return Clock;
    case "tool":
    default:
      return Radio;
  }
}

const PROPOSAL_TONE: Record<CardProposalState["tone"], string> = {
  pending: "#f6d873",
  accepted: "#8fe08a",
  returned: "#f6b873",
  rejected: "#ff8a8a",
  applied: "#8ad0ff",
};

export function AgentWorkCard({ vm, now }: AgentCardProps) {
  const hue = hueByIndex(vm.hue);
  const rows = vm.backscroll.slice(-MAX_ROWS);
  const analysing =
    vm.status === "running" && (!vm.activity || vm.activity.kind === "analysis");
  const activityGlyph = createElement(activityIcon(vm.activity?.kind ?? "analysis"), {
    size: 12,
    color: hue.accent,
    "aria-hidden": true,
    style: { flexShrink: 0 },
  });

  return (
    <div
      className={styles.cardEnter}
      style={{
        width: EXPANDED.w,
        height: EXPANDED.h,
        boxSizing: "border-box",
        padding: 10,
        borderRadius: 12,
        background: INK.surface,
        border: `1px solid ${INK.border}`,
        borderLeft: `3px solid ${hue.edgeGlowless}`,
        color: INK.text,
        display: "flex",
        flexDirection: "column",
        gap: 5,
        overflow: "hidden",
      }}
    >
      {/* 1 — identity + campaign */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 7,
            background: hue.softBg,
            color: hue.accent,
            flexShrink: 0,
          }}
        >
          <AgentIcon agentKey={vm.agentKey} size={15} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {vm.shortName}
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: INK.textMuted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {vm.parentShortName ? `↳ from ${vm.parentShortName}` : vm.kind === "specialist" ? "specialist" : vm.responsibility}
          </div>
        </div>
        <span
          style={{
            ...mono,
            fontSize: 9,
            fontWeight: 600,
            color: hue.accent,
            background: hue.softBg,
            borderRadius: 999,
            padding: "1px 7px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {vm.campaignShortName}
        </span>
        <span
          aria-label={vm.status}
          style={{ width: 8, height: 8, borderRadius: 999, background: statusDot(vm.status), flexShrink: 0 }}
        />
      </div>

      {/* 2 — bounded assignment */}
      <div
        style={{
          fontSize: 11,
          color: INK.textMuted,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={vm.assignment}
      >
        {vm.assignment}
      </div>

      {/* 3 — Work Backscroll */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          borderTop: `1px solid ${INK.rowBorder}`,
          borderBottom: `1px solid ${INK.rowBorder}`,
          paddingBlock: 3,
        }}
      >
        {rows.length === 0 ? (
          <div style={{ ...mono, fontSize: 10, color: INK.textFaint, padding: "2px 0" }}>
            queued · awaiting first event
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.eventId}
              className={styles.backscrollRow}
              style={{ display: "flex", gap: 6, alignItems: "baseline", padding: "1.5px 0" }}
            >
              <span style={{ ...mono, fontSize: 9, color: INK.textFaint, flexShrink: 0 }}>
                {clockStamp(r.at)}
              </span>
              {r.verb ? (
                <span style={{ ...mono, fontSize: 9, color: hue.accent, flexShrink: 0 }}>{r.verb}</span>
              ) : null}
              <span
                style={{
                  fontSize: 10.5,
                  lineHeight: 1.25,
                  color: INK.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.summary}
              </span>
            </div>
          ))
        )}
      </div>

      {/* 4 — current source / tool / handoff / analysis state */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, minHeight: 14 }}>
        {activityGlyph}
        {analysing ? (
          <span style={{ ...mono, color: INK.textMuted }}>
            Analysis in progress · {elapsedClock(vm.activity?.sinceAt ?? vm.startedAt ?? vm.lastEventAt, now)}
          </span>
        ) : (
          <span
            style={{ color: INK.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {vm.activity?.label ?? "Working"}
          </span>
        )}
      </div>

      {/* 5 — latest finding or uncertainty */}
      {vm.latestFinding ? (
        <div
          style={{
            fontSize: 10.5,
            lineHeight: 1.3,
            color: INK.textMuted,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {vm.latestFinding}
        </div>
      ) : null}

      {/* 6 — proposal / review status + elapsed */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          marginTop: "auto",
        }}
      >
        {vm.proposal ? (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              color: PROPOSAL_TONE[vm.proposal.tone],
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{ width: 6, height: 6, borderRadius: 999, background: PROPOSAL_TONE[vm.proposal.tone], flexShrink: 0 }}
            />
            {vm.proposal.label}
          </span>
        ) : (
          <span />
        )}
        <span style={{ ...mono, fontSize: 9.5, color: INK.textFaint, flexShrink: 0 }}>
          {elapsedClock(vm.startedAt, vm.completedAt ? new Date(vm.completedAt).getTime() : now)}
        </span>
      </div>
    </div>
  );
}
