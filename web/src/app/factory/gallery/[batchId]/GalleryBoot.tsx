"use client";

// Client boot for the gallery: the per-campaign stream coordinates live in
// localStorage (stashed by the presenter intake step), which only the browser
// can read. A mount snapshot (useSyncExternalStore) reads them after hydration
// without a server/client mismatch and without setState-in-effect. If they are
// missing (fresh device / expired tokens) we say so honestly rather than showing
// a blank screen.

import { useMemo, useSyncExternalStore } from "react";
import { GalleryLive, getBatch } from "@/components/factory/gallery";

const noopSubscribe = () => () => {};

export function GalleryBoot({ batchId, presenter }: { batchId: string; presenter: boolean }) {
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  );
  const connections = useMemo(
    () => (mounted ? (getBatch(batchId)?.connections ?? null) : null),
    [mounted, batchId],
  );

  if (!mounted) return null;

  if (!connections || connections.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-medium tracking-tight">This batch isn&apos;t open on this device</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The live stream coordinates for this batch aren&apos;t stored here — start a new batch to
          run the factory again.
        </p>
        <a
          href="/factory/present"
          className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
        >
          Start a new batch
        </a>
      </div>
    );
  }

  return <GalleryLive batchId={batchId} connections={connections} presenter={presenter} />;
}
