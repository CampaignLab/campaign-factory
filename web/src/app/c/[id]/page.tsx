import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Journey } from "@/components/Journey";
import { type RunState } from "@/lib/pipeline/types";

// Shareable, read-only campaign page (private-by-default URL). Renders the
// as-generated campaign.
//
// NOTE (M4): reads the run over HTTP from the API route. The in-memory dev store
// is per-route-bundle, so a direct getRun() import wouldn't see runs created by
// the API. When Postgres lands this becomes a direct DB read.
export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
  const res = await fetch(`${proto}://${host}/api/runs/${id}`, { cache: "no-store" });
  if (!res.ok) notFound();
  const run = (await res.json()) as RunState;
  return (
    <main className="min-h-dvh">
      <Journey campaign={run.campaign} />
    </main>
  );
}
