"use client";

// FactoryGallery — the pure renderer. It is a function of the event view model
// (GalleryCampaign[] = W4-folded RunVMs + hue + short name) plus `now`, and does
// NO fetching. The live gallery and W7 replay both render through this exact
// component so live and recorded runs look identically daunting: every agent
// workspace open at full width, all the time (no presentation tiering).

import { useMemo, useRef } from "react";
import { FactoryLedger, FactoryStatsStrip } from "./FactoryLedger";
import { CampaignColumn } from "./CampaignColumn";
import { useFloorFollow } from "./useFloorFollow";
import {
  buildLedger,
  campaignCards,
  campaignEdges,
  type GalleryCampaign,
} from "./viewModel";
import styles from "./gallery.module.css";

export interface FactoryGalleryProps {
  campaigns: GalleryCampaign[];
  now: number;
  connectionLabel?: string; // shown quietly in the ledger (e.g. "live", "recorded run")
  onCancel?: (campaignId: string) => void; // presenter-only per-campaign cancel
}

export function FactoryGallery({ campaigns, now, connectionLabel, onCancel }: FactoryGalleryProps) {
  const perCampaign = useMemo(
    () => campaigns.map((c) => ({ campaign: c, cards: campaignCards(c), edges: campaignEdges(c) })),
    [campaigns],
  );

  const ledger = useMemo(() => buildLedger(campaigns), [campaigns]);

  // Downward floor-follow: as the floor grows the page drifts down with it,
  // hands control back on any manual scroll, re-engages at the bottom. Shared
  // by live and replay because both render through this component.
  const rootRef = useRef<HTMLDivElement | null>(null);
  useFloorFollow(rootRef);

  return (
    <div ref={rootRef} className={styles.floorRoot}>
      <FactoryStatsStrip counts={ledger} />
      <div className={styles.field}>
        {perCampaign.map(({ campaign, cards, edges }) => (
          <CampaignColumn
            key={campaign.run.campaignId}
            campaign={campaign}
            cards={cards}
            edges={edges}
            now={now}
            onCancel={onCancel}
          />
        ))}
      </div>
      <FactoryLedger counts={ledger} connectionLabel={connectionLabel} />
    </div>
  );
}
