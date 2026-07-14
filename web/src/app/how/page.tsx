import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Campaign Factory works",
  description: "How Campaign Factory turns one local problem into a connected, researched campaign — and where humans stay in charge.",
};

// Standalone "how it works" explainer, linked from the site footer.
// Styled with the shared journey.css awake classes for consistency.
export default function HowPage() {
  return (
    <main className="pb-24">
      <header className="jhero">
        <div className="eyebrow">How it works</div>
        <h1>
          One problem in, one connected <span className="serif">campaign</span> out
        </h1>
        <p className="obj">
          Campaign Factory researches a UK local or public-policy problem live, builds a connected plan from a single
          shared campaign object, and drafts the materials — labelling what it can verify and flagging what it can&apos;t.
          A person reviews, edits and owns every output.
        </p>
      </header>

      <div className="jcontainer">
        <div className="diagram" style={{ marginTop: 0 }}>
          <div className="dg-label">Problem → connected campaign</div>
          <div className="howviz">
            <span className="rnode">Campaign input</span><span className="rarrow">→</span>
            <span className="rnode">Live research<small>web + public data</small></span><span className="rarrow">→</span>
            <span className="rnode dm">Shared campaign plan<small>one structured state</small></span><span className="rarrow">→</span>
            <span className="rnode">Specialist tasks<small>power · strategy · drafting · checking</small></span><span className="rarrow">→</span>
            <span className="rnode gate">Human review</span><span className="rarrow">→</span>
            <span className="rnode">Campaign resources</span>
          </div>
        </div>

        <div className="cols2" style={{ marginTop: "1.5rem" }}>
          <div className="rc">
            <h3>How it fits together</h3>
            <ul>
              <li>Research establishes the real local and institutional context first; every claim is labelled with its verification status.</li>
              <li>One shared campaign state connects the objective, power map, pressure analysis, strategy, tactics, organising and every drafted document.</li>
              <li>A consistency check flags anything it couldn&apos;t reconcile against the sources — unverified facts are labelled, never invented.</li>
            </ul>
          </div>
          <div className="rc">
            <h3>What stays human</h3>
            <ul>
              <li>Local knowledge, political judgement, relationships and accountability stay with people.</li>
              <li>Nothing is sent without a person editing and approving it.</li>
              <li>Named individuals&apos; positions are starting points for judgement, not facts — confirm before acting on them.</li>
            </ul>
          </div>
        </div>

        <section id="mission-bay" className="how-mission-bay">
          <div>
            <span className="mb-kicker">Mission Bay</span>
            <h2>A visual model of an agent factory</h2>
            <p>
              Agents do not live in little boxes. In practice, they are bounded software processes running on servers.
              Mission Bay makes their coordination legible: one campaign snapshot is divided into independent workstreams,
              the workstreams run in parallel, a specialist reconciles their evidence and disagreements, and the result
              returns to a person for a decision.
            </p>
          </div>
          <div className="how-factory-flow" aria-label="Mission Bay factory pattern">
            <span>Campaign snapshot<small>immutable for the run</small></span>
            <b>fans out</b>
            <div><span>Examiner</span><span>Examiner</span><span>Examiner</span><span>Examiner</span></div>
            <b>recombines</b>
            <span>Adjudicator<small>preserves disagreement</small></span>
            <b>returns to</b>
            <span>Human review<small>nothing is sent or changed</small></span>
          </div>
        </section>
      </div>
    </main>
  );
}
