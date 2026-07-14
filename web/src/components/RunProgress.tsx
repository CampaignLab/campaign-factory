"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { pollRun } from "@/lib/client/api";
import { type RunState, type StageId, type StageStatus } from "@/lib/pipeline/types";

const STAGES: { id: StageId; title: string; desc: string; agent: string }[] = [
  { id: "research", title: "Researching live", desc: "Searching official sources and verifying facts", agent: "scout · verifier" },
  { id: "plan", title: "Building the campaign plan", desc: "Objective, power map, pressure, tactics, organising", agent: "strategy · power · tactics" },
  { id: "drafts", title: "Drafting the materials", desc: "Decision-maker, press and supporter packs", agent: "lobbying · media · digital" },
  { id: "lint", title: "Checking consistency", desc: "Flagging anything unverified", agent: "verifier" },
];

const TERMINAL = new Set(["complete", "partial", "failed"]);

// Ported stepper marker from the prototype (○ pending · ◐ running · ✓ done · ✕ failed).
function StageIcon({ status }: { status: StageStatus }) {
  if (status === "done") return <span className="text-[var(--good)]">✓</span>;
  if (status === "failed") return <span className="text-[var(--bad)]">✕</span>;
  if (status === "running")
    return <span className="inline-block animate-spin text-[var(--warn)]">◐</span>;
  return <span className="text-[var(--ring)]">○</span>;
}

export function RunProgress({
  runId,
  onComplete,
  onRetry,
}: {
  runId: string;
  onComplete: (s: RunState) => void;
  onRetry: () => void;
}) {
  const [state, setState] = useState<RunState | null>(null);
  const done = useRef(false);

  useEffect(() => {
    done.current = false;
    let alive = true;
    const tick = async () => {
      const s = await pollRun(runId);
      if (!alive || !s) return;
      setState(s);
      if (TERMINAL.has(s.status) && !done.current) {
        done.current = true;
        // Small delay so the final ticks are visible before we swap views.
        setTimeout(() => alive && onComplete(s), 600);
      }
    };
    void tick();
    const iv = setInterval(tick, 2500);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [runId, onComplete]);

  const notes = state?.notes ?? [];
  const lastNote = notes[notes.length - 1];
  const doneCount = STAGES.filter((s) => state?.stages[s.id]?.status === "done").length;
  const anyRunning = STAGES.some((s) => state?.stages[s.id]?.status === "running");
  // Progress-bar fill: complete stages, plus a half-step for the one in flight.
  const pct = Math.min(100, Math.round(((doneCount + (anyRunning ? 0.5 : 0)) / STAGES.length) * 100));
  const failed = state ? STAGES.filter((s) => state.stages[s.id]?.status === "failed") : [];

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-24">
      <div className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
        Building your campaign · live research
      </div>
      <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Building your campaign…</h2>
      <p className="mt-3 max-w-[62ch] text-muted-foreground">
        Research first, then one shared campaign plan drives every stage and all the documents. This runs live
        and takes a few minutes — you can leave it open.
      </p>

      {/* Top progress bar — fills as stages complete */}
      <div className="mt-8 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Vertical stepper with per-stage state + live note */}
      <ol className="mt-9 flex flex-col gap-6">
        {STAGES.map((s) => {
          const st = state?.stages[s.id]?.status ?? "pending";
          const isRunning = st === "running";
          const dim = st === "pending" ? "opacity-40" : st === "done" ? "opacity-80" : "opacity-100";
          // The running stage shows the newest live note; others show their static description.
          const note = isRunning && lastNote ? lastNote : s.desc;
          return (
            <li key={s.id} className={`flex gap-3.5 transition-opacity duration-300 ${dim}`}>
              <span className="w-6 flex-none pt-0.5 text-center text-lg leading-none">
                <StageIcon status={st} />
              </span>
              <div className="min-w-0">
                <div className="text-[1.05rem] font-medium leading-snug">{s.title}</div>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[0.72rem] text-muted-foreground">
                    🤖 {s.agent}
                  </span>
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">{note}</div>
                {st === "failed" && state?.stages[s.id]?.error ? (
                  <div className="mt-1 text-xs text-[var(--bad)]">{state.stages[s.id]?.error}</div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {failed.length > 0 && (
        <div className="mt-9 rounded-[var(--r-xl)] border border-[var(--warn)] bg-tint-yellow p-4 text-sm">
          <p className="font-medium text-foreground">
            {failed.length === STAGES.length ? "This run didn't complete." : "Some stages didn't complete."}
          </p>
          <p className="mt-1 text-muted-foreground">
            {failed.length === STAGES.length
              ? "Nothing usable was produced. You can try running it again."
              : "What did complete is kept and shown — nothing is invented to fill the gaps."}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}

      <p className="mt-10 text-sm text-muted-foreground">
        Drafts, not decisions: everything produced here needs human review, local knowledge, and verification
        before use.
      </p>
    </div>
  );
}
