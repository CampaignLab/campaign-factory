import type { Metadata } from "next";
import { HowJourney } from "./HowJourney";

export const metadata: Metadata = {
  title: "How the agent factory works",
  description:
    "How Campaign Factory's agent factory turns one local problem into a researched, reviewed campaign — the agent graph, the evidence rules, the documents it produces, and its honest limits.",
};

// Standalone "how it works" explainer, linked from the site footer. Rebuilt in
// the legacy campaign-brief structure (journey.css): numbered rail, rung
// sections with sticky asides, framed cards. Interactive scrollspy lives in
// the client component.
export default function HowPage() {
  return (
    <main className="min-h-dvh">
      <HowJourney />
    </main>
  );
}
