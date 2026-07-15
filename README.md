# Campaign Factory

Campaign Factory is a public, self-serve web app that turns a UK local or public-policy problem — *"I want the council to keep the library open in Highfields"* — into a complete campaign: objective, power map, pressure strategy, tactics, organising plan, and drafted materials, all **researched live** while you watch.

Its soul is a **no-synthetic-data integrity principle**: research runs against real sources, every claim carries one of **7 verification labels**, drafts mark unresolved facts with **`[VERIFY: …]`** markers, and when a stage fails it is **shown as failed — never faked**. The prototype's fake-campaign generator was deliberately not ported.

This repo contains two implementations of that idea:

- **Current Production** (`main`, this branch) — a routed pipeline of four model calls, deployed on Vercel + Neon. This README describes it.
- **The multi-agent factory** ([`factory/multi-agent-build`](https://github.com/CampaignLab/campaign-factory/tree/factory/multi-agent-build), [PR #10](https://github.com/CampaignLab/campaign-factory/pull/10)) — a real fifteen-agent LangGraph campaign graph on a dedicated always-on worker. Same product, same integrity principle, different runtime. No production cutover happens without an explicit Factory Promotion.

## How it works

- **You enter a problem at `/`.** Starting a run is gated by the conference access code, a per-session run cap, a per-IP cap, and a global £150/day spend kill-switch — checked before anything spends money.
- **A routed pipeline of four model calls runs over one shared campaign state** (`web/src/lib/pipeline/`): Stage A research (Claude Sonnet 5 + web search, high effort → claims carrying the 7 verification labels), Stage B plan (Claude Opus 4.8 — plan coherence is un-lintable, so never split or downgraded), Stage C drafts (Sonnet 5 ×3 parallel → nine documents in three audience packs: decision-maker / press / supporter), and a Haiku 4.5 lint (labels present, `[VERIFY:]` markers present, no invented names, dates, or contacts).
- **The run is a background job** with write-through Postgres persistence; the client polls for progress and the journey UI **reveals progressively** — research is readable while the plan and drafts still generate.
- **Failure is honest.** A failed stage surfaces a banner and whatever completed is kept; there is no synthetic fallback.
- **Finished campaigns are durable and shareable** at `/c/[id]`. The owner can opt into the conference wall or delete; an admin can hide wall items.
- **The multi-agent rewrite** replaces this pipeline with a fifteen-agent LangGraph graph on an always-on worker — built and verified on the `factory/multi-agent-build` branch (PR #10), not yet promoted to production.

## Repository layout

| Path | What it is |
|---|---|
| [`web/`](web/) | The production **Next.js** app. **See [`web/README.md`](web/README.md) to run it.** |
| [`app/`](app/) | The original localhost prototype — **reference only** (not deployed). |
| [`archive/`](archive/) | Earlier HTML prototypes, preserved and inspectable. |
| [`docs/adr/`](docs/adr/) | Architecture decision records 0001–0016 — the design record for the multi-agent factory rewrite. |
| [`docs/product/`](docs/product/) | The [implementation parameters](docs/product/factory-implementation-parameters.md) and the [12-hour build plan](docs/product/factory-12-hour-build-plan.md) for the rewrite. |
| [`docs/research/`](docs/research/) | Deep-research notes (e.g. why this is a workflow, not a multi-agent system). |
| [`PLAN.md`](PLAN.md) | Full product plan and locked decisions. |
| [`HOW_IT_WAS_BUILT.md`](HOW_IT_WAS_BUILT.md) | Architecture-and-story companion. |
| [`EXECUTION_JOURNAL.md`](EXECUTION_JOURNAL.md) | Chronological build log (summarised at the end of this README). |
| [`CONTEXT.md`](CONTEXT.md) | The shared campaign-design language the product uses. |

## Quick start

```bash
# 1. Postgres — local Docker…
docker run -d --name cf-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=campaign_factory -p 5433:5432 postgres:16
# …or pull the linked Vercel/Neon env vars instead:  vercel env pull

# 2. web/.env.local
#   DATABASE_URL=postgres://postgres:postgres@localhost:5433/campaign_factory
#   ANTHROPIC_API_KEY=sk-ant-...   # optional locally; without it, runs fail cheap by design

# 3. Install + run
cd web
npm install
npm run dev            # http://localhost:3000
```

The DB schema is created automatically on first request, so there is no separate migration step. `node scripts/seed-fixture.mjs` inserts a real campaign fixture as a completed run, so the UI (`/c/<id>`, `/wall`) is explorable without a live run. Full detail — environment variables, Vercel setup, go-live requirements — is in [`web/README.md`](web/README.md).

## The URLs

| URL | What it does |
|---|---|
| [`/`](web/src/app/page.tsx) | The **Campaign Builder**: entry form → live run progress (stage ticker + research feed) → the scroll-reveal campaign journey. Starting a run requires the access code. |
| [`/c/[id]`](web/src/app/c/%5Bid%5D/page.tsx) | Shareable, read-only campaign page (private-by-default URL, durable Postgres read). |
| [`/wall`](web/src/app/wall/page.tsx) | The **conference wall** — campaigns people made here and chose to share. |
| [`/how`](web/src/app/how/page.tsx) | Standalone "how it works" explainer, linked from the footer. |
| [`/admin`](web/src/app/admin/page.tsx) | The fire extinguisher: enter the admin key, see the wall, hide anything. |
| [`/dev/preview`](web/src/app/dev/preview/page.tsx) | Dev-only: renders the journey from a bundled fixture (no DB, no run). |

Key API routes: `POST /api/runs` (gated start) · `GET /api/runs/[id]` (poll) · `/api/runs/[id]/share` · `/api/status` · `/api/wall` · `/api/admin/hide`.

> On the [`factory/multi-agent-build`](https://github.com/CampaignLab/campaign-factory/tree/factory/multi-agent-build) branch the map changes: `/` redirects to the multi-agent `/factory`, and this builder moves to `/legacy`. See that branch's README for the full factory URL map.

## Components & how it was built

A summary of [`EXECUTION_JOURNAL.md`](EXECUTION_JOURNAL.md); the narrative version is [`HOW_IT_WAS_BUILT.md`](HOW_IT_WAS_BUILT.md).

**13 Jul 2026 — Current Production built and deployed (M1–M5).** The localhost prototype (`app/`) was rewritten as a public Next.js app after a decision-locking grilling session: public self-serve, durable background runs, access code + session cap + £150/day kill-switch, server-side persistence with shareable URLs and an opt-in wall, and **no synthetic data, ever**. Milestones: M1 scaffold + the routed pipeline, M2 launch controls and the spend ledger, M3 the scroll-reveal journey UI, M4 Postgres persistence + serverless execution via `after()`, M5 the wall and admin surfaces. Deployed on Vercel (build root `web/`) + Neon Postgres, auto-deploying from `main`. Known constraint: function-duration limits mean a full 6–15 min run can't complete in one function on the current plan — one driver of the worker architecture below (see the go-live requirements in [`web/README.md`](web/README.md)).

**The multi-agent factory rewrite (PR #10).** The same product re-expressed as a genuine fifteen-agent LangGraph campaign graph, designed through ADRs [0001](docs/adr/0001-visible-agents-correspond-to-runtime-work.md)–[0016](docs/adr/0016-use-an-oss-langgraph-worker-on-railway.md) and the accepted [implementation-parameters envelope](docs/product/factory-implementation-parameters.md), then built as a compressed parallel effort per the [12-hour build plan](docs/product/factory-12-hour-build-plan.md). It lives on [`factory/multi-agent-build`](https://github.com/CampaignLab/campaign-factory/tree/factory/multi-agent-build): an always-on Railway worker (pg-boss durable queue, LangGraph over one shared state, Postgres checkpoints with orphan recovery), a signed HMAC web ↔ worker boundary with SSE event streaming, four screens (public intake + Campaign Assembly View, presenter desk + Factory Gallery, a pinned 15-minute conference replay, and this builder kept at `/legacy`), and a mock mode that exercises the whole system with zero model calls. It runs end to end and has completed live single-campaign and presenter-batch runs.

**Status.** Current production (this branch) remains unchanged while the rewrite is built; the existing `after()` pipeline and its function-duration limit remain current-production constraints until an explicit Factory Promotion. Open work is tracked in the [issues](https://github.com/CampaignLab/campaign-factory/issues).
