"use client";

// The /how explainer in the legacy campaign-brief language: fixed number rail,
// rung sections (sticky numbered aside + content column), framed cards, tags,
// and the same scroll-reveal + scrollspy choreography as the Journey component.
// Content is written for conference attendees, not engineers, and sticks to
// what the repo actually does (README.md, contracts/, worker/src/graph).

import { useEffect, useRef, useState, type ReactNode } from "react";

const REPO_URL = "https://github.com/CampaignLab/campaign-factory";

const SECTIONS: [string, string][] = [
  ["factory", "What the factory is"],
  ["graph", "The agent graph"],
  ["evidence", "Evidence & verification"],
  ["review", "Review & decision points"],
  ["documents", "The documents"],
  ["limits", "Honest limits"],
  ["built", "How it was built"],
];

// The seven verification labels (lib/pipeline/labels.ts) with plain glosses,
// mapped to the same provenance tag classes the campaign brief uses.
const LABELS: { label: string; cls: string; gloss: string }[] = [
  { label: "Verified public information", cls: "real", gloss: "confirmed against an authoritative public source, with a link." },
  { label: "Supported inference", cls: "gen", gloss: "follows from verified facts, but is not itself on the record." },
  { label: "Generated campaign recommendation", cls: "gen", gloss: "the factory's own advice, labelled as advice." },
  { label: "Campaign assumption", cls: "mock", gloss: "something the campaign asserts — check it before relying on it." },
  { label: "Conflicting evidence", cls: "verify", gloss: "sources disagree, and the disagreement is shown, not resolved by guesswork." },
  { label: "Verification incomplete", cls: "verify", gloss: "could not be confirmed in the time available." },
  { label: "External information unavailable", cls: "ext", gloss: "the public record simply doesn't say." },
];

// The nine Canonical Campaign Documents (contracts/documents.ts), in order.
const DOCUMENTS: { name: string; gloss: string }[] = [
  { name: "Campaign Brief", gloss: "the whole campaign in one readable document." },
  { name: "Objective and Theory of Change", gloss: "what winning means, and why this route could produce it." },
  { name: "Power and Stakeholder Map", gloss: "who decides, who influences them, and who can be moved." },
  { name: "Campaign Strategy", gloss: "narrative, audiences, coalition, phases and escalation." },
  { name: "Tactics and Timeline", gloss: "sequenced actions, each with an owner and a success sign." },
  { name: "Organising Plan", gloss: "asks, volunteer roles, and a ladder of engagement for supporters." },
  { name: "Lobbying Pack", gloss: "meeting requests, briefings and scripts for decision-makers." },
  { name: "Media Pack", gloss: "press release, journalist pitch, and draft quotes attributed to roles only." },
  { name: "Digital Campaign Pack", gloss: "action-page copy, supporter email and social posts." },
];

function Rung({
  id,
  n,
  title,
  sub,
  chip,
  limit,
  revealed,
  active,
  children,
}: {
  id: string;
  n: number;
  title: ReactNode;
  sub?: ReactNode;
  chip?: string;
  limit?: ReactNode;
  revealed: Set<string>;
  active: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rung cf-reveal${active === id ? " active" : ""}`}
      id={`j-${id}`}
      data-stage={id}
      data-on={revealed.has(id) ? "1" : "0"}
    >
      <div className="jcontainer rung-grid">
        <aside>
          <div className="n">{n}</div>
          <h2>{title}</h2>
          {sub ? <p className="whatsnew">{sub}</p> : null}
          {chip ? <span className="agents-chip">🤖 {chip}</span> : null}
          {limit ? <p className="limit">{limit}</p> : null}
        </aside>
        <div className="rc">{children}</div>
      </div>
    </section>
  );
}

export function HowJourney() {
  const [active, setActive] = useState<string>("");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  // Scroll-reveal + scrollspy (same pattern as Journey), but as two observers:
  // the scrollspy band (20%–45% of the viewport) is too strict for revealing a
  // short final section — its top can never reach the band — so reveal gets a
  // generous margin of its own.
  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-stage]"));
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(new Set(sections.map((s) => s.dataset.stage!)));
    }
    const reveal = new IntersectionObserver(
      (entries) => {
        setRevealed((prev) => {
          const next = new Set(prev);
          for (const e of entries) if (e.isIntersecting) next.add((e.target as HTMLElement).dataset.stage!);
          return next;
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );
    const spy = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive((vis[0].target as HTMLElement).dataset.stage!);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: 0.01 },
    );
    sections.forEach((s) => {
      reveal.observe(s);
      spy.observe(s);
    });
    return () => {
      reveal.disconnect();
      spy.disconnect();
    };
  }, []);

  return (
    <div className="pb-24" ref={wrapRef}>
      {/* fixed number rail (scrollspy) */}
      <nav className="rail">
        {SECTIONS.map(([id, label], i) => (
          <a key={id} href={`#j-${id}`} className={active === id ? "cur" : ""} title={label}>
            {i + 1}
          </a>
        ))}
      </nav>

      {/* hero */}
      <header className="jhero">
        <div className="eyebrow">How it works · open source · every output requires human review</div>
        <h1>
          How the agent <span className="serif">factory</span> works
        </h1>
        <p className="obj">
          You give Campaign Factory one UK local or public-policy problem and a named place. A team of AI
          agents researches it live and assembles a whole campaign in front of you. This page explains the
          machine behind that — in plain terms, and honestly about what it can&apos;t do.
        </p>
        <p style={{ marginTop: "1.1rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <a className="toolbtn" style={{ display: "inline-block", textDecoration: "none" }} href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Read the source on GitHub ↗
          </a>
          <a className="toolbtn" style={{ display: "inline-block", textDecoration: "none" }} href="/factory">
            Try it — build a campaign
          </a>
        </p>
      </header>

      {/* 1 — what the agent factory is */}
      <Rung
        id="factory"
        n={1}
        title={<>What the agent <span className="serif">factory</span> is</>}
        sub="One local problem in; one connected, researched campaign out."
        chip="13 fixed roles + picked specialists"
        limit="It drafts and researches. Judgement, relationships and accountability stay with people."
        revealed={revealed}
        active={active}
      >
        <p data-anim="1">
          The factory is a team of AI agents that builds a campaign the way a good campaigns office would:
          research first, then evidence-checking, then analysis, then strategy, then the materials. Each agent
          has one job and a named contract — a research director, an evidence adjudicator, a power-map analyst,
          a strategy architect, three producers, and so on. Thirteen roles are fixed; on top of those, the
          factory picks specialists to suit your problem — council records for a council decision, planning for
          a planning fight, parliamentary for anything that runs through Westminster.
        </p>
        <p className="callout warm" data-anim="2">
          It is a factory in the literal sense: work passes along a line, one stage at a time, and a reviewer
          stands between the stages. Nothing reaches you that hasn&apos;t been through the gates.
        </p>
        <div className="kvrow" data-anim="3">
          <span className="kv"><b>In:</b> one problem + one named place</span>
          <span className="kv"><b>Out:</b> a ten-step campaign brief</span>
          <span className="kv"><b>Plus:</b> nine campaign documents</span>
          <span className="kv"><b>Always:</b> every claim labelled</span>
        </div>
      </Rung>

      {/* 2 — the agent graph */}
      <Rung
        id="graph"
        n={2}
        title={<>The agent <span className="serif">graph</span></>}
        sub="Work flows one way — research, evidence, analysis, strategy, production — with a reviewer gate between every stage."
        chip="the full line, in order"
        limit="Agents never talk to each other directly — everything passes through one shared campaign state, saved at every stage, so a crashed run resumes where it stopped."
        revealed={revealed}
        active={active}
      >
        <div className="diagram" data-anim="1" style={{ marginTop: 0 }}>
          <div className="dg-label">The campaign line — reviewer gates in yellow</div>
          <div className="howviz">
            <span className="rnode">Research<small>director + chosen specialists, in parallel</small></span>
            <span className="rarrow">→</span>
            <span className="rnode">Evidence<small>adjudicator rules on every claim</small></span>
            <span className="rarrow">→</span>
            <span className="rnode gate">Reviewer</span>
            <span className="rarrow">→</span>
            <span className="rnode">Analysis<small>objective · decision route · power · pressure</small></span>
            <span className="rarrow">→</span>
            <span className="rnode gate">Reviewer</span>
            <span className="rarrow">→</span>
            <span className="rnode">Strategy<small>one architect</small></span>
            <span className="rarrow">→</span>
            <span className="rnode gate">Reviewer</span>
            <span className="rarrow">→</span>
            <span className="rnode">Production<small>tactics · organising · lobbying · media · digital</small></span>
            <span className="rarrow">→</span>
            <span className="rnode gate">Final review</span>
            <span className="rarrow">→</span>
            <span className="rnode dm">Your campaign</span>
          </div>
        </div>
        <div className="cols2" data-anim="2">
          <div>
            <h3>The first half: finding out</h3>
            <p>
              <b>Research</b> starts wide: the research director scopes the problem and sets the questions,
              while the specialists dig into the local record at the same time. <b>Evidence</b> then narrows:
              the adjudicator takes every claim the researchers surfaced and decides what it can honestly be
              called — confirmed, qualified, conflicted, not found, or stale.
            </p>
            <h3>The middle: making sense of it</h3>
            <p>
              <b>Analysis</b> runs four agents side by side: one sets the objective, one maps the formal
              decision route, one builds the power and stakeholder map, one works out where pressure could
              actually bite.
            </p>
          </div>
          <div>
            <h3>The second half: deciding and making</h3>
            <p>
              <b>Strategy</b>{" "}is a single architect that turns the analysis into one coherent approach — and if
              the reviewer isn&apos;t satisfied, it sends the strategy back for one round of revision before
              anything gets built on it. <b>Production</b> then runs five agents at once: tactics, organising,
              and the three producers who draft the lobbying, media and digital materials.
            </p>
            <h3>The gates</h3>
            <p>
              Between every stage sits the same reviewer, reading what was proposed before the next stage is
              allowed to build on it. More on that in section 4.
            </p>
          </div>
        </div>
      </Rung>

      {/* 3 — evidence & verification */}
      <Rung
        id="evidence"
        n={3}
        title={<>Evidence &amp; <span className="serif">verification</span></>}
        sub="Research runs live against real public sources. Nothing is invented to fill a gap."
        chip="director · specialists · adjudicator"
        limit="Only what could be verified is called verified — and every source is listed, with its link, in the finished campaign."
        revealed={revealed}
        active={active}
      >
        <p data-anim="1">
          The researchers work from the real public record — council papers, official announcements, local
          reporting — through a bounded budget of live web searches. There is no synthetic data anywhere in the
          product: the original prototype had a fake-campaign generator, and it was deliberately not carried
          over. Every claim that survives research is put in front of the evidence adjudicator, which assigns
          it exactly one of seven labels:
        </p>
        <div className="wire" data-anim="2">
          <div className="wire-bar">
            <span className="dots"><i /><i /><i /></span> the seven verification labels · every claim carries exactly one
          </div>
          <div className="wire-body">
            {LABELS.map((l) => (
              <div key={l.label} className="line">
                <span className={`tag ${l.cls}`}>{l.label}</span>
                <span>{l.gloss}</span>
              </div>
            ))}
          </div>
        </div>
        <p data-anim="3">
          The labels follow the claims all the way into the drafts: an unresolved fact in a letter or press
          release appears as a highlighted{" "}
          <mark style={{ background: "rgba(246, 230, 131, .8)", borderRadius: 3, padding: "0 2px" }}>[VERIFY: …]</mark>{" "}
          placeholder rather than a confident-sounding
          guess, so nothing unchecked can slip into an email unnoticed. And if an agent ever returns a label
          that isn&apos;t on the list, it is downgraded to &ldquo;Verification incomplete&rdquo; — never
          upgraded.
        </p>
      </Rung>

      {/* 4 — review & decision points */}
      <Rung
        id="review"
        n={4}
        title={<>Review &amp; decision <span className="serif">points</span></>}
        sub="One reviewer closes every stage — and choices the factory shouldn't make alone are surfaced to you."
        chip="campaign synthesis reviewer"
        limit="The reviewer is an agent, not the human backstop. Final judgement is always yours."
        revealed={revealed}
        active={active}
      >
        <div data-anim="1">
          <h3>The reviewer gate</h3>
          <p>
            A dedicated reviewer reads each stage&apos;s output and does one of three things: <b>accepts</b> it,
            <b> returns</b> it once for revision, or <b>rejects</b> it. It writes a short report on every stage
            it closes, and when it disagrees with something, the disagreement is preserved in the record rather
            than smoothed over. A rejected piece of work stays rejected — it is shown as such, not quietly
            patched.
          </p>
        </div>
        <div data-anim="2">
          <h3>Decision points — surfaced to you</h3>
          <p>
            Some choices shouldn&apos;t be made by a machine on your behalf. When the factory hits one — an
            ambiguous scope, genuinely conflicting evidence, a real strategic fork, or something only local
            knowledge can settle — it raises a <b>judgement request</b>: a plain question, the options, and the
            default it will proceed with.
          </p>
          <p className="callout">
            You can answer, accept the default, or leave it — the line keeps moving either way, and whatever
            you choose is applied to everything it affects. The point is that the choice is <b>visible</b>: the
            factory tells you what it assumed instead of hiding it.
          </p>
        </div>
        <div data-anim="3">
          <h3>And after the run</h3>
          <p>
            Everything the factory produces is a first draft addressed to a person. Nothing is sent, published
            or acted on unless a human has edited and approved it.
          </p>
        </div>
      </Rung>

      {/* 5 — the documents */}
      <Rung
        id="documents"
        n={5}
        title={<>The documents it <span className="serif">produces</span></>}
        sub="Nine documents, in a fixed order — six compiled from the reviewed brief, three drafted by producer agents."
        chip="lobbying · media · digital producers"
        limit="Every document compiles from the same shared campaign state, so no document can quietly contradict the brief."
        revealed={revealed}
        active={active}
      >
        <div className="docgrid" data-anim="1">
          {DOCUMENTS.map((doc, i) => (
            <div className="doccard" key={doc.name}>
              <span className="d-n">Document {i + 1} of {DOCUMENTS.length}</span>
              <h3>{doc.name}</h3>
              <div className="d-prev">{doc.gloss}</div>
            </div>
          ))}
        </div>
        <p className="hint-sm" data-anim="2">
          Each document finishes as <b>ready</b> or <b>needs verification</b> — an honest status, not a
          decoration. The packs carry their unresolved facts as visible [VERIFY: …] notes.
        </p>
      </Rung>

      {/* 6 — honest limits */}
      <Rung
        id="limits"
        n={6}
        title={<>Honest <span className="serif">limits</span></>}
        sub="A hard time cap and a spend ceiling sit over every run — and gaps are shown, never papered over."
        limit="Everything it produces is a draft for human judgement, not a decision."
        revealed={revealed}
        active={active}
      >
        <p data-anim="1">
          Every campaign runs under a hard time limit and cost guards, checked before each stage is allowed to
          start. When a limit trips, the run finishes deterministically: what&apos;s done is kept, and whatever
          didn&apos;t happen is recorded as a <b>terminal gap</b> — a visible entry saying &ldquo;this work was
          not completed&rdquo;.
        </p>
        <p className="callout warm" data-anim="2">
          A stage that fails is shown as failed. A campaign that ran out of time is shown as partial. The
          factory never fabricates completion — that rule is enforced in the machinery, not just promised in
          the copy.
        </p>
        <div data-anim="3">
          <h3>What it can&apos;t do</h3>
          <ul>
            <li>It can only verify what&apos;s on the public record — if the council hasn&apos;t published it, the factory can&apos;t confirm it.</li>
            <li>Positions attributed to named people are inferences to be checked with them, never facts.</li>
            <li>Time-capped research can leave questions open; they are listed as unresolved, not answered by guesswork.</li>
            <li>It doesn&apos;t know your community. Local knowledge, relationships and political judgement stay human.</li>
          </ul>
        </div>
      </Rung>

      {/* 7 — how it was built */}
      <Rung
        id="built"
        n={7}
        title={<>How it was <span className="serif">built</span></>}
        sub="Two implementations of the same product live in one open repository."
        chip="AI agents building an AI agent factory"
        limit="The original single-agent builder is kept in the repo as the tested fallback and comparison point."
        revealed={revealed}
        active={active}
      >
        <p data-anim="1">
          The repository holds two versions of the same idea, sharing the same evidence rules. The first is a
          straightforward pipeline — a handful of large model calls in sequence — which shipped first and still
          runs as the legacy builder. The second is the multi-agent factory described on this page: a genuine
          fifteen-agent graph (built on the open-source LangGraph) running on its own always-on worker, saving
          its progress at every stage and streaming its work to your browser as it happens.
        </p>
        <p className="callout" data-anim="2">
          The factory rewrite was itself built by AI coding agents working to human decisions — an AI agent
          team building an AI agent factory. Each significant choice was argued out and written down as an
          architecture decision record before it was implemented, so the reasoning is as inspectable as the
          code.
        </p>
        <p data-anim="3" style={{ marginTop: "1.4rem" }}>
          <a className="cta" href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Architecture docs &amp; decision records in the repo
            <span className="chip">↗</span>
          </a>
        </p>
      </Rung>
    </div>
  );
}
