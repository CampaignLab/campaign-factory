import { notFound } from "next/navigation";
import { Journey } from "@/components/Journey";
import sample from "@/lib/dev/sample-campaign.json";
import { type Campaign } from "@/lib/pipeline/types";

// Dev-only preview: renders the Journey against a real campaign fixture (from an
// earlier live run) so the UI can be exercised without spending on a run. Not
// available in production.
export default function Preview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-dvh">
      <Journey campaign={sample as unknown as Campaign} />
    </main>
  );
}
