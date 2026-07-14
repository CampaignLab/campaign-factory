"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { type StartInput } from "@/lib/client/api";

// The 8 optional structured fields (ported from the prototype intake). Only
// `problem` is required — research fills the gaps and reports what it couldn't
// establish. Placeholders match the old well-spaced pill fields; `label` is kept
// for accessibility (used as aria-label).
const STRUCTURED: { key: keyof StartInput; label: string; placeholder: string }[] = [
  { key: "org", label: "Campaign or organisation name", placeholder: "Campaign / organisation name (optional)" },
  { key: "location", label: "Location or postcode", placeholder: "Location or postcode (optional)" },
  { key: "outcome", label: "Desired outcome", placeholder: "Desired outcome (optional)" },
  { key: "dm", label: "Known decision-maker or institution", placeholder: "Known decision-maker or institution (optional)" },
  { key: "timeframe", label: "Timeframe", placeholder: "Timeframe (optional)" },
  { key: "affected", label: "People affected", placeholder: "People affected (optional)" },
  { key: "evidence", label: "Known evidence or context", placeholder: "Known evidence or context (optional)" },
  { key: "resources", label: "Available campaign resources", placeholder: "Available campaign resources (optional)" },
];

// Prepared examples (ported verbatim from the prototype). The example button
// toggles between the primary Lime demo and the library-closure backup.
const EXAMPLE_LIME: StartInput = {
  problem:
    "I want Lime bikes to be allowed to enter Queen Elizabeth Olympic Park in Stratford. This affects people who use shared bikes to travel to and around the park. Identify who controls the decision, why the current restriction exists, and what campaign could change it.",
  location: "Stratford, London E20",
  outcome: "Shared e-bikes permitted to ride and park within the park",
  affected: "park visitors, commuters crossing the park, shared-bike users",
};
const EXAMPLE_BACKUP: StartInput = {
  problem:
    "The council plans to close the local library in six weeks. Residents want the decision reversed or delayed while alternative funding options are considered.",
  org: "Friends of the Library",
  location: "Nottingham",
  timeframe: "six weeks",
};

const PROBLEM_PLACEHOLDER =
  "I want [decision-maker or organisation, if known] to [specific change] in [location] by [timeframe, if known], because [problem or reason]. This affects [people or community]. We already know [evidence, context, allies, or constraints].";

export function EntryForm({
  onStart,
  busy,
  error,
  accessRequired = false,
  initialCode = "",
}: {
  onStart: (input: StartInput, code: string) => void;
  busy?: boolean;
  error?: string | null;
  accessRequired?: boolean;
  initialCode?: string;
}) {
  const [form, setForm] = useState<StartInput>({ problem: "" });
  const [code, setCode] = useState(initialCode);
  const [exampleToggle, setExampleToggle] = useState(false);
  const set = (k: keyof StartInput, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const codeOk = !accessRequired || code.trim().length > 0;
  const canSubmit = (form.problem || "").trim().length >= 8 && codeOk && !busy;

  const loadExample = () => {
    setForm({ ...(exampleToggle ? EXAMPLE_BACKUP : EXAMPLE_LIME) });
    setExampleToggle((t) => !t);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-24">
      <header className="mb-12 text-center sm:mb-14">
        <div className="text-xs font-medium uppercase tracking-[0.09em] text-muted-foreground">
          From a local problem to a working campaign — live
        </div>
        <h1 className="mx-auto mt-4 max-w-[18ch] text-4xl font-medium tracking-tight sm:text-6xl">
          Turn a local problem into a <span className="font-serif font-normal italic">whole campaign</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-[58ch] text-lg text-muted-foreground sm:text-xl">
          Describe the local or public-policy problem you want to change. Campaign Factory researches it,
          verifies what it can, and turns it into a campaign objective, power analysis, strategy, organising
          plan, and a set of practical campaign resources.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onStart(normalise(form), code.trim());
        }}
        className="space-y-7"
      >
        <div className="space-y-2.5">
          <Label htmlFor="problem" className="text-base">
            What&apos;s the problem?
          </Label>
          <Textarea
            id="problem"
            value={form.problem}
            onChange={(e) => set("problem", e.target.value)}
            placeholder={PROBLEM_PLACEHOLDER}
            rows={5}
            className="min-h-[9.5rem] rounded-[var(--r-2xl)] border-[1.5px] p-5 text-base leading-relaxed sm:text-lg"
            autoFocus
          />
          <div className="rounded-[var(--r-xl)] bg-secondary px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            <b className="font-semibold text-foreground">Don&apos;t know who decides?</b>{" "}
            That&apos;s fine — try:
            “I want to change [problem] in [location]. The outcome I want is [desired change]. This matters
            because [reason]. Help me identify who has the power to make the decision and how a campaign could
            influence them.” Imperfect prompts are expected; the research stage fills gaps and says what it
            couldn&apos;t establish.
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Add more detail (all optional)
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {STRUCTURED.map((f) => (
              <Input
                key={f.key}
                id={f.key}
                aria-label={f.label}
                value={(form[f.key] as string) || ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="h-auto rounded-full border-[1.5px] px-4 py-2.5 text-sm"
              />
            ))}
          </div>
        </div>

        {accessRequired ? (
          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-sm">
              Conference access code
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the code shown on screen"
              className="max-w-xs"
            />
          </div>
        ) : null}

        {error ? <p className="text-sm text-[var(--bad)]">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <button type="submit" className="cta" disabled={!canSubmit}>
            {busy ? "Starting…" : "Build the campaign"}
            <span className="chip">→</span>
          </button>
          <button
            type="button"
            onClick={loadExample}
            className="max-w-md flex-1 cursor-pointer rounded-[var(--r-xl)] border border-dashed border-[var(--ring)] bg-secondary px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <b className="mb-0.5 block text-foreground">Prepared example — Lime bikes in the Olympic Park</b>
            “I want Lime bikes to be allowed to enter Queen Elizabeth Olympic Park in Stratford…” · emergency
            backup: library closure
          </button>
        </div>
      </form>

      <p className="mx-auto mt-10 max-w-[60ch] text-center text-sm text-muted-foreground">
        Optimised for UK local government, public bodies, transport, planning, environment, education, health,
        public services, constituency issues and consultations. The factory follows: problem → research →
        objective → decision-maker → power → pressure → strategy → tactics → organising → drafted resources.
      </p>
    </div>
  );
}

function normalise(f: StartInput): StartInput {
  const out: StartInput = { problem: f.problem.trim() };
  for (const k of ["org", "location", "outcome", "dm", "timeframe", "affected", "evidence", "resources"] as const) {
    const v = (f[k] as string | undefined)?.trim();
    if (v) out[k] = v;
  }
  return out;
}
