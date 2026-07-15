// Compact agent card (~180×96). An active agent that is not currently in the
// expanded set. Never merged into a fake team count — every active agent keeps
// its own card. Carries: campaign hue + short name, agent icon, responsibility
// (or parent relationship), current work verb, and last meaningful event.

import { hueByIndex } from "./hues";
import { AgentIcon } from "./icons";
import { INK, COMPACT, mono, statusDot } from "./chrome";
import { clockStamp, elapsedClock } from "./format";
import styles from "./factory.module.css";
import type { AgentCardProps } from "./types";

export function CompactAgentCard({ vm, now }: AgentCardProps) {
  const hue = hueByIndex(vm.hue);
  const last = vm.backscroll[vm.backscroll.length - 1];
  const analysing =
    vm.status === "running" && (!vm.activity || vm.activity.kind === "analysis");

  return (
    <div
      className={styles.cardEnter}
      title={`${vm.displayName} — ${vm.responsibility}`}
      style={{
        width: COMPACT.w,
        height: COMPACT.h,
        boxSizing: "border-box",
        padding: 8,
        borderRadius: 10,
        background: INK.surfaceCompact,
        border: `1px solid ${INK.border}`,
        borderLeft: `3px solid ${hue.edgeGlowless}`,
        color: INK.text,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        overflow: "hidden",
      }}
    >
      {/* identity row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: 6,
            background: hue.softBg,
            color: hue.accent,
            flexShrink: 0,
          }}
        >
          <AgentIcon agentKey={vm.agentKey} size={13} />
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.15,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {vm.shortName}
        </span>
        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span style={{ ...mono, fontSize: 8.5, color: hue.accent, letterSpacing: "0.02em" }}>
            {vm.campaignShortName}
          </span>
          <span
            aria-label={vm.status}
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: statusDot(vm.status),
            }}
          />
        </span>
      </div>

      {/* parent relationship or responsibility */}
      <div
        style={{
          fontSize: 10,
          color: INK.textMuted,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {vm.parentShortName ? `↳ from ${vm.parentShortName}` : vm.responsibility}
      </div>

      {/* current work / last meaningful event */}
      <div
        style={{
          fontSize: 11,
          lineHeight: 1.25,
          color: INK.text,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {analysing ? (
          <span style={{ ...mono, color: INK.textMuted }}>
            Analysis in progress · {elapsedClock(vm.activity?.sinceAt ?? vm.lastEventAt, now)}
          </span>
        ) : (
          <>
            {vm.verb ? (
              <span style={{ ...mono, color: hue.accent, marginRight: 4 }}>{vm.verb}</span>
            ) : null}
            <span>{vm.activity?.label ?? last?.summary ?? vm.assignment}</span>
          </>
        )}
      </div>

      {/* last event stamp */}
      {last ? (
        <div style={{ ...mono, fontSize: 8.5, color: INK.textFaint, marginTop: "auto" }}>
          {clockStamp(last.at)}
        </div>
      ) : null}
    </div>
  );
}
