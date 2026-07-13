"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { LabelChip } from "@/components/LabelChip";
import { Button } from "@/components/ui/button";
import { VERIFICATION_LABELS, type VerificationLabel } from "@/lib/pipeline/labels";
import { type Campaign, type SourceClaim } from "@/lib/pipeline/types";

/* Highlight [VERIFY: …] markers so unresolved facts are visible, never hidden. */
function withVerify(text: string): ReactNode {
  if (!text) return text;
  const parts = text.split(/(\[VERIFY:[^\]]*\])/g);
  return parts.map((p, i) =>
    /^\[VERIFY:/.test(p) ? (
      <mark key={i} className="rounded bg-amber-100 px-1 text-amber-900">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function Section({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: ReactNode }) {
  return (
    <Reveal className="scroll-mt-20 border-t py-12">
      <div id={id} className="mx-auto w-full max-w-3xl px-5">
        {kicker ? (
          <div data-anim="1" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {kicker}
          </div>
        ) : null}
        <h2 data-anim="1" className="mt-1 text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        <div data-anim="2" className="mt-4 space-y-4 text-[15px] leading-relaxed">
          {children}
        </div>
      </div>
    </Reveal>
  );
}

function DocCard({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div data-anim="2" className="rounded-lg border bg-card/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{title}</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="sm" onClick={download}>
            Download
          </Button>
        </div>
      </div>
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-muted-foreground">{withVerify(text)}</pre>
    </div>
  );
}

export function Journey({ campaign, onReset }: { campaign: Campaign; onReset?: () => void }) {
  const c = campaign;
  const r = c.research;
  const p = c.plan;
  const d = c.drafts;

  // assemble the nine documents from the three draft groups
  const docs = useMemo(() => {
    const out: { title: string; text: string }[] = [];
    const push = (title: string, text?: string) => {
      if (text && text.trim()) out.push({ title, text });
    };
    if (d?.lobbying) {
      push("Decision-maker meeting email", d.lobbying.meetingEmail);
      push("Meeting agenda", d.lobbying.agenda);
      push("Decision-maker briefing", d.lobbying.briefing);
    }
    if (d?.media) {
      push("Press release", d.media.pressRelease);
      push("Media pitch email", d.media.pitchEmail);
    }
    if (d?.digital) {
      push("Supporter email", d.digital.supporterEmail);
      push("Action / petition page", d.digital.actionPageCopy);
      if (d.digital.socialPosts?.length)
        push("Social posts", d.digital.socialPosts.map((s) => `[${s.platform}]\n${s.text}`).join("\n\n"));
      if (d.digital.faq?.length) push("FAQ", d.digital.faq.map((q) => `Q: ${q.q}\nA: ${q.a}`).join("\n\n"));
    }
    return out;
  }, [d]);

  const nav = [
    r && { id: "problem", label: "Problem" },
    r && { id: "research", label: "Research" },
    p?.objective && { id: "objective", label: "Objective" },
    (r?.decisionMaker || p?.objective) && { id: "decision", label: "Decision" },
    p?.stakeholders?.length && { id: "power", label: "Power" },
    p?.pressures?.length && { id: "pressure", label: "Pressure" },
    p?.strategy && { id: "strategy", label: "Strategy" },
    p?.tactics?.length && { id: "tactics", label: "Tactics" },
    p?.organising && { id: "organising", label: "Organising" },
    docs.length && { id: "documents", label: "Documents" },
    c.sources?.length && { id: "sources", label: "Sources" },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <div className="pb-24">
      {/* sticky section nav */}
      <nav className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-5 py-2 text-sm">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="whitespace-nowrap rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              {n.label}
            </a>
          ))}
          {onReset ? (
            <button onClick={onReset} className="ml-auto whitespace-nowrap rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              New campaign
            </button>
          ) : null}
        </div>
      </nav>

      {/* hero */}
      <div className="mx-auto w-full max-w-3xl px-5 pt-12">
        <p className="text-sm font-medium tracking-wide text-muted-foreground">Campaign Factory</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{c.name}</h1>
        {c.refinedProblem ? <p className="mt-3 text-lg text-muted-foreground">{c.refinedProblem}</p> : null}
        {(c.completed.research === false || c.completed.plan === false || c.completed.drafts === false) && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            This campaign is incomplete — some stages didn&apos;t finish. What&apos;s shown is real; nothing was invented to fill the gaps.
          </div>
        )}
      </div>

      {r ? (
        <Section id="problem" kicker="The ask" title="What you're really asking">
          <p>{c.interpretation}</p>
          {r.context?.howItChanged ? (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">How research refined this: </span>
              {r.context.howItChanged}
            </p>
          ) : null}
        </Section>
      ) : null}

      {r ? (
        <Section id="research" kicker="Verified situation" title="What we could establish">
          {r.context?.situation ? <p>{r.context.situation}</p> : null}
          {r.context?.currentPolicy ? (
            <p>
              <span className="font-medium">Current policy: </span>
              {r.context.currentPolicy}
            </p>
          ) : null}
          {r.unresolvedQuestions?.length ? (
            <div className="rounded-lg border bg-card/40 p-4">
              <div className="text-sm font-medium">Unresolved questions</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {r.unresolvedQuestions.slice(0, 6).map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : null}

      {p?.objective ? (
        <Section id="objective" kicker="Objective" title="What winning looks like">
          <p className="text-lg">
            We want <strong>{p.objective.dm}</strong> to <strong>{p.objective.action}</strong> by{" "}
            <strong>{p.objective.by}</strong> — even if the immediate win is only{" "}
            <strong>{p.objective.mvw}</strong>.
          </p>
          {p.objective.success ? <p className="text-muted-foreground">{p.objective.success}</p> : null}
        </Section>
      ) : null}

      {r?.decisionMaker || p?.objective ? (
        <Section id="decision" kicker="Decision-maker" title="Who actually decides">
          {r?.decisionMaker?.formal ? (
            <p>
              <span className="font-medium">Formal route: </span>
              {r.decisionMaker.formal}
            </p>
          ) : null}
          {r?.decisionMaker?.practical ? (
            <p>
              <span className="font-medium">Practical route: </span>
              {r.decisionMaker.practical}
            </p>
          ) : null}
          {r?.decisionMaker?.deadlines?.length ? (
            <p className="text-muted-foreground">Deadlines: {r.decisionMaker.deadlines.join("; ")}</p>
          ) : null}
        </Section>
      ) : null}

      {p?.stakeholders?.length ? (
        <Section id="power" kicker="Power map" title="Who holds the power">
          <div className="grid gap-3 sm:grid-cols-2">
            {p.stakeholders.map((s, i) => (
              <div key={i} data-anim="2" className="rounded-lg border bg-card/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{s.name || s.role}</div>
                  <LabelChip label={s.positionStatus} short />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {s.tier} · power: {s.power}
                </div>
                {s.position ? <p className="mt-2 text-sm">{s.position}</p> : null}
                {s.ask ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Ask: </span>
                    {s.ask}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {p?.pressures?.length ? (
        <Section id="pressure" kicker="Pressure" title="What makes the status quo costlier than change">
          {p.statusQuoCost ? <p className="text-muted-foreground">{p.statusQuoCost}</p> : null}
          <div className="space-y-3">
            {p.pressures.map((pr, i) => (
              <div key={i} data-anim="2" className="rounded-lg border bg-card/40 p-4 text-sm">
                <div className="font-medium">{pr.type}</div>
                <p className="mt-1">
                  {pr.why} — applied by <span className="font-medium">{pr.whoApplies}</span> via {pr.channel}.
                </p>
                {pr.action ? <p className="mt-1 text-muted-foreground">Activation: {pr.action}</p> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {p?.strategy ? (
        <Section id="strategy" kicker="Strategy" title="The plan of attack">
          {p.strategy.narrative ? <p>{p.strategy.narrative}</p> : null}
          {p.strategy.phases?.length ? (
            <ol className="mt-2 space-y-2">
              {p.strategy.phases.map((ph, i) => (
                <li key={i} data-anim="2" className="rounded-lg border bg-card/40 p-3 text-sm">
                  <span className="font-medium">
                    {i + 1}. {ph.name}
                  </span>{" "}
                  <span className="text-muted-foreground">({ph.when})</span>
                  <div className="text-muted-foreground">{ph.focus}</div>
                </li>
              ))}
            </ol>
          ) : null}
        </Section>
      ) : null}

      {p?.tactics?.length ? (
        <Section id="tactics" kicker="Tactics" title="What to actually do">
          <div className="space-y-3">
            {p.tactics.map((t, i) => (
              <div key={i} data-anim="2" className="rounded-lg border bg-card/40 p-4 text-sm">
                <div className="font-medium">
                  {t.name} <span className="text-muted-foreground">· phase {t.phase}</span>
                </div>
                {t.purpose ? <p className="mt-1">{t.purpose}</p> : null}
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  {t.owner ? <span>Owner: {t.owner}</span> : null}
                  {t.success ? <span>Success sign: {t.success}</span> : null}
                  {t.approval ? <span className="sm:col-span-2">Human approval: {t.approval}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {p?.organising ? (
        <Section id="organising" kicker="Organising" title="The people, not just the plan">
          {p.organising.whoActs ? <p>{p.organising.whoActs}</p> : null}
          {p.organising.ladder?.length ? (
            <div>
              <div className="text-sm font-medium">Ladder of engagement</div>
              <ol className="mt-2 space-y-1 text-sm">
                {p.organising.ladder.map((l, i) => (
                  <li key={i} data-anim="2" className="text-muted-foreground">
                    <span className="font-medium text-foreground">{l.rung}:</span> {l.action}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {p.organising.humanEssential?.length ? (
            <div className="rounded-lg border bg-card/40 p-4">
              <div className="text-sm font-medium">What the machine can&apos;t do</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {p.organising.humanEssential.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : null}

      {docs.length ? (
        <Section id="documents" kicker="Ready to use" title="Your campaign materials">
          <p className="text-muted-foreground">
            First drafts to adapt — quotes are attributed to roles, not real people, and unresolved facts are
            marked <mark className="rounded bg-amber-100 px-1 text-amber-900">[VERIFY: …]</mark>.
          </p>
          <div className="space-y-3">
            {docs.map((doc) => (
              <DocCard key={doc.title} title={doc.title} text={doc.text} />
            ))}
          </div>
        </Section>
      ) : null}

      {c.sources?.length ? <SourcesSection sources={c.sources} /> : null}

      <Section id="built" kicker="How this was built" title="Input → live research → plan → materials → human review">
        <p className="text-muted-foreground">
          Research runs live against official sources with the facts labelled; the plan and materials are
          generated from those facts; a consistency check flags anything unverified. Local knowledge,
          judgement, relationships and accountability stay with people.
        </p>
        {c.lint && c.lint.flags.length ? (
          <div className="rounded-lg border bg-card/40 p-4 text-sm">
            <div className="font-medium">Consistency check flagged {c.lint.flags.length} item(s) to verify</div>
            <ul className="mt-2 list-disc pl-5 text-muted-foreground">
              {c.lint.flags.slice(0, 5).map((f, i) => (
                <li key={i}>{f.issue}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>
    </div>
  );
}

function SourcesSection({ sources }: { sources: SourceClaim[] }) {
  const [filter, setFilter] = useState<VerificationLabel | "all">("all");
  const present = useMemo(() => {
    const set = new Set(sources.map((s) => s.status));
    return VERIFICATION_LABELS.filter((l) => set.has(l));
  }, [sources]);
  const shown = filter === "all" ? sources : sources.filter((s) => s.status === filter);

  return (
    <Section id="sources" kicker="Sources" title="What we checked — and what we couldn't">
      <div data-anim="1" className="flex flex-wrap gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          All ({sources.length})
        </Button>
        {present.map((l) => (
          <Button key={l} variant={filter === l ? "default" : "outline"} size="sm" onClick={() => setFilter(l)}>
            {l} ({sources.filter((s) => s.status === l).length})
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {shown.map((s, i) => (
          <div key={i} data-anim="2" className="rounded-lg border bg-card/40 p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p>{s.claim}</p>
              <LabelChip label={s.status} short />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {s.sourceOrg}
              {s.url && s.url.startsWith("http") ? (
                <>
                  {" · "}
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                    source
                  </a>
                </>
              ) : null}
              {s.accessDate ? ` · accessed ${s.accessDate}` : null}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
