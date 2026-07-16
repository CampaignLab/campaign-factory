// Pinned conference replay (ADR 0001 / parameters §7). This route NEVER changes
// (REPLAY_ROUTE = /factory/replay/conference). It loads the single pinned,
// immutable manifest via W1's store and renders it ENTIRELY from the stored
// public Factory Events through the same fold + gallery renderer as a live run.
// Zero model calls, zero writes. Promotion is a back-office CLI step
// (scripts/promote-replay.mjs) — there is NO in-product promotion path.
//
// If nothing is pinned yet, an honest empty state is shown — never a fake run.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { factorySql } from "@/lib/factory/store";
import { getPinnedReplay } from "@/lib/factory/store/replay";
import { REPLAY_ROUTE, parseReplayManifest } from "@/lib/factory/replay";
import { PRESENTER_COOKIE, verifyPresenterToken } from "@/app/api/factory/present/session";
import { ReplayClient } from "./ReplayClient";

// Reads the pinned row + the presenter cookie at request time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Previous Run · Campaign Factory",
};

export default async function ConferenceReplayPage() {
  const record = await getPinnedReplay(factorySql(), REPLAY_ROUTE).catch(() => null);
  const body = record ? parseReplayManifest(record.manifest) : null;

  if (!record || !body) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Campaign Factory
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-tight">No recorded run has been promoted yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The permanent replay lives here once a real completed batch is promoted from the back office.
          Nothing is shown until then — this page never fabricates a run.
        </p>
      </main>
    );
  }

  const store = await cookies();
  const presenter = verifyPresenterToken(store.get(PRESENTER_COOKIE)?.value);
  // User-facing name is "Previous Run" (16 Jul); stored manifests keep their
  // original "Recorded real run · <date>" label. Show the recording's full
  // date AND time at the top (user request, 16 Jul) — sourced from the
  // manifest's creation instant, London time.
  const recordedAt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(record.createdAt));
  const label = `Previous Run · ${recordedAt}`;

  return (
    <main className="min-h-dvh">
      <ReplayClient body={body} label={label} presenter={presenter} />
    </main>
  );
}
