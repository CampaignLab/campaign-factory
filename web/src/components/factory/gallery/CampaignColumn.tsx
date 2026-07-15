"use client";

// One campaign region: opaque anchor (sticky, above everything), any open
// Judgement cards (also above), then the agent cards grouped by presentation
// (expanded → compact → pills), with a per-campaign connector overlay behind
// the cards. When the campaign reaches a usable terminal state its cluster is
// replaced by a Completion Receipt.

import { useMemo, useRef } from "react";
import { AgentWorkCard, CompactAgentCard, AgentIdentityPill, hueByIndex } from "@/components/factory/cards";
import type { AgentCardVM, CardPresentation } from "@/components/factory/cards";
import type { JudgementAnswerRequest } from "@/lib/factory/contracts";
import { CampaignCompletionReceipt } from "@/components/factory/receipts/CampaignCompletionReceipt";
import cardStyles from "@/components/factory/cards/factory.module.css";
import styles from "./gallery.module.css";
import { CampaignAnchor } from "./CampaignAnchor";
import { JudgementCard } from "./JudgementCard";
import { ConnectorLayer } from "./ConnectorLayer";
import { runVmToCampaignReceipt } from "./receiptModel";
import type { ConnectorEdge, GalleryCampaign } from "./viewModel";

export function CampaignColumn({
  campaign,
  cards,
  presentation,
  edges,
  now,
  onCancel,
  onAnswerJudgement,
}: {
  campaign: GalleryCampaign;
  cards: AgentCardVM[];
  presentation: Map<string, CardPresentation>;
  edges: ConnectorEdge[];
  now: number;
  onCancel?: (campaignId: string) => void;
  onAnswerJudgement?: (
    campaignId: string,
    judgementId: string,
    action: JudgementAnswerRequest["action"],
    answer?: string,
  ) => void;
}) {
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const { run } = campaign;

  const activeAgents = cards.filter((c) => c.status === "queued" || c.status === "running").length;
  const sectionsAccepted = Object.values(run.sections).filter((s) => s.status === "accepted").length;
  const showReceipt = run.status === "completed" || run.status === "partial" || !!run.receiptAt;

  const expanded = cards.filter((c) => presentation.get(c.agentRunId) === "expanded");
  const compact = cards.filter((c) => presentation.get(c.agentRunId) === "compact");
  const pills = cards.filter((c) => presentation.get(c.agentRunId) === "pill");

  const openJudgements = run.judgements.filter((j) => j.status === "open" || j.status === "defaulted");

  // Layout signature: recompute connectors only when something that moves cards
  // changes (which cards exist and how each is presented).
  const revision = useMemo(
    () => cards.map((c) => `${c.agentRunId}:${presentation.get(c.agentRunId) ?? "?"}`).join("|"),
    [cards, presentation],
  );

  return (
    <div className={styles.column}>
      <CampaignAnchor
        campaign={campaign}
        activeAgents={activeAgents}
        sectionsAccepted={sectionsAccepted}
        onCancel={onCancel}
      />

      {openJudgements.length > 0 ? (
        <div className={styles.judgementStack}>
          {openJudgements.map((j) => (
            <JudgementCard
              key={j.id}
              judgement={j}
              hue={campaign.hue}
              onAnswer={
                onAnswerJudgement
                  ? (jid, action, answer) => onAnswerJudgement(run.campaignId, jid, action, answer)
                  : undefined
              }
            />
          ))}
        </div>
      ) : null}

      {showReceipt ? (
        <>
          <CampaignCompletionReceipt
            receipt={runVmToCampaignReceipt(run)}
            accent={hueByIndex(campaign.hue).accent}
            compact
          />
          {pills.length > 0 ? (
            <div className={styles.pillGroup}>
              {pills.map((vm) => (
                <AgentIdentityPill key={vm.agentRunId} vm={vm} now={now} />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className={styles.cardsArea} ref={cardsRef}>
          <ConnectorLayer containerRef={cardsRef} edges={edges} revision={revision} />

          {expanded.length > 0 ? (
            <div className={styles.cardGroup}>
              {expanded.map((vm) => (
                <div
                  key={vm.agentRunId}
                  data-agent-run-id={vm.agentRunId}
                  className={cardStyles.reposition}
                >
                  <AgentWorkCard vm={vm} now={now} />
                </div>
              ))}
            </div>
          ) : null}

          {compact.length > 0 ? (
            <div className={styles.cardGroup}>
              {compact.map((vm) => (
                <div
                  key={vm.agentRunId}
                  data-agent-run-id={vm.agentRunId}
                  className={cardStyles.reposition}
                >
                  <CompactAgentCard vm={vm} now={now} />
                </div>
              ))}
            </div>
          ) : null}

          {pills.length > 0 ? (
            <div className={styles.pillGroup}>
              {pills.map((vm) => (
                <div key={vm.agentRunId} data-agent-run-id={vm.agentRunId} className={cardStyles.reposition}>
                  <AgentIdentityPill vm={vm} now={now} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
