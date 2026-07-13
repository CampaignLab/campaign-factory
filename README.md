# Campaign Factory

A public, self-serve web app that turns a UK local or public-policy problem — *"I want the council to keep the library open in Highfields"* — into a complete campaign: objective, power map, pressure strategy, tactics, organising plan, and drafted materials, all **researched live**. Its soul is a **no-synthetic-data integrity principle**: research runs against real sources, every claim carries one of **7 verification labels**, drafts mark unresolved facts with **`[VERIFY: …]`** markers, and when a stage fails it is **shown as failed — never faked**. The prototype's fake-campaign generator was deliberately not ported.

## How it works

A routed pipeline of four model calls over one shared campaign state:

- **Stage A · Research** — Claude Sonnet 5 + web search, high effort → verified claims, each carrying one of the 7 labels.
- **Stage B · Plan** — Claude Opus 4.8 → the coherent campaign plan (never split, never downgraded — plan coherence is un-lintable).
- **Stage C · Drafts** — Claude Sonnet 5 ×3 parallel → nine documents in three audience packs (decision-maker / press / supporter).
- **Lint** — Claude Haiku 4.5 → cheap consistency check: labels present, `[VERIFY:]` markers present, no invented names, dates, or contacts.

The run happens as a background job; the client polls for progress and the **journey UI reveals progressively** — research is readable while the plan and drafts still generate. Finished campaigns live at a shareable URL and can be opted into a **conference wall** with a projector mode.

## Repository layout

| Path | What it is |
|---|---|
| [`web/`](web/) | The production **Next.js** app. **See [`web/README.md`](web/README.md) to run it.** |
| [`app/`](app/) | The original localhost prototype — **reference only** (not deployed). |
| [`PLAN.md`](PLAN.md) | Full product plan and locked decisions. |
| [`HOW_IT_WAS_BUILT.md`](HOW_IT_WAS_BUILT.md) | Architecture-and-story companion. |
| [`EXECUTION_JOURNAL.md`](EXECUTION_JOURNAL.md) | Chronological build log. |
| [`docs/research/`](docs/research/) | Deep-research notes (e.g. why this is a workflow, not a multi-agent system). |

## Quickstart

See **[`web/README.md`](web/README.md)** for prerequisites, local database setup, environment variables, and Vercel configuration.

## Status

Built end to end across milestones M1–M5 (pipeline → launch controls → journey UI → persistence → wall) and **deployed on Vercel + Neon Postgres**, GitHub-connected for auto-deploys from `main` (build root: `web/`).

**Not yet publicly usable:** deployment protection is on, and the Hobby plan's 300s function cap can't fit a full run — durable step execution (Vercel Workflow) is the intended fix. See the [open issues](https://github.com/sugaroverflow/campaign-factory/issues) and [`web/README.md`](web/README.md#️-technical-requirements-before-going-live) for what's needed before go-live.
