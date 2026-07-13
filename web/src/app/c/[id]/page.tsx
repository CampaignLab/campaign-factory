import { notFound } from "next/navigation";
import { getRunState } from "@/lib/db/runs";
import { Journey } from "@/components/Journey";

// Shareable, read-only campaign page (private-by-default URL). Reads the campaign
// directly from Postgres — durable and shareable across instances.
export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRunState(id);
  if (!run) notFound();
  return (
    <main className="min-h-dvh">
      <Journey campaign={run.campaign} />
    </main>
  );
}
