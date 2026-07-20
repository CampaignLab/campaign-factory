# Campaign Factory

Campaign Factory is a public, self-serve web app that turns a UK local or public-policy problem — *"I want the council to keep the library open in Highfields"* — into a complete campaign: objective, power map, pressure strategy, tactics, organising plan, and drafted materials, all **researched live** while you watch. It's live at **[campaign-factory.vercel.app](https://campaign-factory.vercel.app)**.

Its soul is a **no-synthetic-data integrity principle**: research runs against real sources, every claim carries one of **7 verification labels**, drafts mark unresolved facts with **`[VERIFY: …]`** markers, and when a stage fails it is **shown as failed — never faked**. When a run crosses a cost or time limit, the remaining work is recorded as **Terminal Gaps**, not fabricated. The prototype's fake-campaign generator was deliberately not ported.

It was built as a prototype in two days for the **AI & Campaigning conference (16 July 2026)**, ran a live three-campaign batch on stage, and has kept running since. Please verify before using any AI-generated content.

## Bring your own key (BYOK)

Public runs execute on **your** API key, never ours: paste an **Anthropic** (`sk-ant-…`) or **OpenRouter** (`sk-or-…`) key into the intake form. A campaign typically costs **$1.50–$3** of your credit and is **hard-capped at $20**.

How your key is treated:

- **Validated before the run starts** — a zero-cost check against your provider (and, for OpenRouter, a balance check) rejects bad or empty-credit keys at the form with a clear message.
- **Encrypted at rest** — the worker seals it with AES-256-GCM before it touches the database, decrypts it only while your run executes, and **deletes it at every terminal state** (completed, cancelled, or failed). It is never logged or shown in events.
- **Never blended with our spend** — BYOK runs are excluded from the app's own budget accounting, and a rejected or out-of-credits key fails fast with an honest note instead of burning retries.

OpenRouter runs go through OpenRouter's Anthropic-compatible endpoint with the same models, server-side web search, and prompt caching as direct Anthropic runs (verified by probe — see PR #13). OpenRouter adds ~5% to provider pricing.

## How it works

- **You enter a problem, a named place, and your API key** at `/factory`. The place must be specific — the input gate rejects "UK" or "online" because research needs a real decision route to run against.
- **A campaign graph assembles the campaign live.** Thirteen fixed agent responsibilities plus up to two campaign-selected specialists (20 hard cap) run as a LangGraph over one shared campaign state. Public runs use the **express profile**: typically ~20 minutes, with a **25-minute "publish everything" point** (finished work is reviewed and published; nothing new starts) and a **30-minute absolute wall clock**.
- **Agent execution runs on a separate worker, not in Vercel functions.** An always-on Node worker (`worker/`) owns the durable `pg-boss` queue, the graph, and `PostgresSaver` checkpoints, so a crashed run resumes from its last node. The web app talks to it only across a signed HMAC boundary (ADR 0015/0016).
- **You watch it happen.** The worker appends Factory Events to Postgres; the browser streams them over SSE (run-scoped token, polling fallback) into the **Campaign Assembly View** — Agent Work Cards, evidence states, the progressive Campaign Brief, then the drafted materials, downloadable documents, and a Campaign Completion Receipt.
- **Resilience is layered.** Provider overloads get patient jittered retries, other failures one visible retry, and public runs on Sonnet get a final attempt on Opus before a gap is recorded. Dead API keys skip all of that and fail fast.
- **Limits are enforced, honestly.** Cost guards ($10 warning / $20 hard stop per campaign; $40 / $80 per presenter batch) and hard time limits are checked at node boundaries; crossing one finalises deterministically and records remaining work as Terminal Gaps.
- **Complete campaigns share into the Gallery automatically** — audience-run campaigns appear under "From the audience", stage and organiser runs under "From the organizers' agent factory". Partial runs never get a public card.
- **Everything runs without an API key in mock mode.** `FACTORY_MODEL_MODE=mock` exercises the full graph, events, UI, recovery, and replay with deterministic fixtures and zero model calls.

## Repository layout

| Path | What it is |
|---|---|
| [`web/`](web/) | The **Next.js** app (Vercel): intake, assembly view, gallery, replay, presenter desk. See [`web/README.md`](web/README.md) to run it. |
| [`worker/`](worker/) | The **Factory Runtime Worker** (Railway) — LangGraph JS + pg-boss + Postgres checkpoints. See [`worker/README.md`](worker/README.md). |
| [`db/factory/`](db/factory/) | Factory database migrations (applied automatically by the worker on boot). |
| [`Dockerfile`](Dockerfile) / [`railway.toml`](railway.toml) | Worker deployment to Railway (ADR 0016); built from the repo root because the worker imports shared modules from `web/src`. |
| [`docs/adr/`](docs/adr/) | Architecture decision records 0001–0016. |
| [`docs/product/`](docs/product/) | The [implementation parameters](docs/product/factory-implementation-parameters.md), the [12-hour build plan](docs/product/factory-12-hour-build-plan.md), and the [verification results](docs/product/factory-verification-results.md) (measured cost/latency, honest defects). |
| [`docs/research/`](docs/research/) | Deep-research notes (e.g. why this is a workflow, not a multi-agent system). |
| [`PLAN.md`](PLAN.md) | Full product plan and locked decisions. |
| [`HOW_IT_WAS_BUILT.md`](HOW_IT_WAS_BUILT.md) | Architecture-and-story companion. |
| [`EXECUTION_JOURNAL.md`](EXECUTION_JOURNAL.md) | Chronological build log (summarised at the end of this README). |
| [`CONTEXT.md`](CONTEXT.md) | The shared campaign-design language the product uses. |
| [`app/`](app/) | The original localhost prototype — reference only, not deployed. |
| [`archive/`](archive/) | Earlier HTML prototypes, preserved and inspectable. |

## Quick start

The web app and the worker are two processes against the same Postgres.

```bash
# 1. Worker (from the repo root)
cd worker
cp .env.example .env      # set FACTORY_SIGNING_SECRET and FACTORY_MODEL_MODE
npm install
npm run start             # :8787 — applies factory migrations on boot

# 2. Web
cd ../web
npm install
npm run dev               # :3000 — needs DATABASE_URL + FACTORY_* vars in .env.local
```

Key points (full detail in [`web/README.md`](web/README.md) and [`worker/README.md`](worker/README.md)):

- `FACTORY_SIGNING_SECRET`, `FACTORY_ENV_ID`, and `FACTORY_MODEL_MODE` **must agree** across web and worker, or runs fail closed.
- `FACTORY_MODEL_MODE=mock` needs no API key; `live` requires `ANTHROPIC_API_KEY` (house/presenter runs) and `FACTORY_BYOK_SECRET` (seals visitors' keys — without it BYOK runs are refused rather than stored in plaintext).
- A Postgres `DATABASE_URL` is required (local Docker or Neon); both apps migrate themselves — there is no separate migration step.

## The URLs

### Public product (the factory)

| URL | What it does |
|---|---|
| `/` | Redirects to `/factory` — the factory is the front door. |
| [`/factory`](web/src/app/factory/page.tsx) | Public intake: problem + named place + **your API key** (Anthropic or OpenRouter). Starts an express-profile run and redirects to the assembly view. |
| [`/factory/c/[campaignId]`](web/src/app/factory/c/%5BcampaignId%5D/page.tsx) | The **Campaign Assembly View** — the live per-campaign page. The brief opens immediately; the client attaches the SSE/polling event stream. |
| [`/gallery`](web/src/app/gallery/page.tsx) | The **Campaign Gallery**: fully complete campaigns only, split into "From the organizers' agent factory" and "From the audience" (auto-shared), plus legacy-builder campaigns with a legacy pill. `/wall` redirects here. |
| [`/how`](web/src/app/how/page.tsx) | Standalone "how it works" explainer, linked from the footer. |

### Conference / session surfaces

| URL | What it does |
|---|---|
| [`/replay`](web/src/app/replay/page.tsx) | Redirects to `/factory/replay/conference`. (`/live` is kept as a silent forward for older links.) |
| [`/factory/replay/conference`](web/src/app/factory/replay/conference/page.tsx) | The pinned, immutable **recorded run** from conference day ("Previous Run", timestamped), condensed to 15:00 with a real-time toggle. Rendered entirely from stored Factory Events through the same renderer as a live run — zero model calls, zero writes. Promotion is a back-office CLI step (`scripts/promote-replay.mjs`). |
| [`/factory/live`](web/src/app/factory/live/page.tsx) | The **true real-time spectator view**: read-only mirror of the most recent presenter batch's gallery (polling, no tokens). Falls back to the recorded replay when no batch has run. |
| [`/presenter`](web/src/app/presenter/page.tsx) | Alias — redirects to `/factory/multi-campaign-demo`. |
| [`/factory/multi-campaign-demo`](web/src/app/factory/multi-campaign-demo/page.tsx) | The **multi-campaign demo** (presenter desk): fire a batch of 1–5 campaigns on the house key (full or express profile). A presenter session auto-issues as an HttpOnly cookie (verified server-side, ADR 0013). `/factory/present` redirects here. |
| [`/factory/gallery/[batchId]`](web/src/app/factory/gallery/%5BbatchId%5D/page.tsx) | The presenter's live **Factory Gallery** for a batch — every agent workspace open at once over the assembling brief, plus a Batch Receipt. Requires the presenter cookie. |

### Legacy (single-agent builder)

| URL | What it does |
|---|---|
| [`/legacy`](web/src/app/legacy/page.tsx) | The original single-agent Campaign Builder (a routed four-call pipeline), moved off the homepage and unlinked from the nav. Kept as the tested fallback and comparison point. |
| [`/c/[id]`](web/src/app/c/%5Bid%5D/page.tsx) | Shareable, read-only campaign page from the legacy builder (private-by-default URL, durable Postgres read). |
| `/wall` | Old gallery path — redirects to `/gallery`. |

### Admin & dev

| URL | What it does |
|---|---|
| [`/admin`](web/src/app/admin/page.tsx) | The fire extinguisher: enter the admin key, see the wall, hide anything. |
| [`/factory/admin/costs`](web/src/app/factory/admin/costs/page.tsx) | Internal cost + latency ledger: per-campaign spend vs the $10/$20 guards, per-batch vs $40/$80, and the latency milestone table. Gated by `CF_ADMIN_KEY`. Deliberately plain — not product UI. |
| `/dev/preview`, `/factory/dev/*` | Dev-only component previews (journey, gallery, documents) rendered from bundled fixtures — no DB, no run. |

## Components & how it was built

A summary of [`EXECUTION_JOURNAL.md`](EXECUTION_JOURNAL.md) and the branch history; the narrative version is [`HOW_IT_WAS_BUILT.md`](HOW_IT_WAS_BUILT.md).

**13 Jul 2026 — the first production build (now `/legacy`).** The localhost prototype (`app/`) was rewritten as a public Next.js app after a decision-locking grilling session: public self-serve, durable background runs, launch controls and a spend ledger, server-side persistence with shareable URLs and an opt-in wall, and **no synthetic data, ever**. A routed pipeline — Sonnet 5 research → Opus 4.8 plan → Sonnet 5 ×3 drafts → Haiku 4.5 lint — deployed on Vercel + Neon, auto-deploying from `main`. Its function-duration limits were one driver of the worker architecture below.

**13–15 Jul 2026 — the multi-agent factory rewrite.** The four-call pipeline was re-expressed as a genuine fifteen-agent LangGraph campaign graph, designed through ADRs [0001](docs/adr/0001-visible-agents-correspond-to-runtime-work.md)–[0016](docs/adr/0016-use-an-oss-langgraph-worker-on-railway.md) and an accepted [implementation-parameters envelope](docs/product/factory-implementation-parameters.md), then built as a compressed parallel effort per the [12-hour build plan](docs/product/factory-12-hour-build-plan.md): the always-on Railway worker (durable queue → graph → checkpoints, orphan recovery, cost/time guards, Terminal Gaps), the signed web↔worker boundary with SSE event streaming, the four screens (intake + assembly view, presenter desk + gallery, pinned replay, legacy fallback), and full mock mode. On 15 Jul the factory **became production**: `/` → `/factory`, express profile everywhere, legacy to `/legacy`.

**16 Jul 2026 — conference day.** Show-morning hardening (judgement-flow fix, atomic cap claims, error boundaries, footer disclaimer), a provider-overload retry ladder with an Opus last resort built mid-incident, limits raised for the live audience, and a three-campaign batch fired on stage at 4× condensed replay. The day's best batch (27/27 sections, 27/27 documents) was pinned as the permanent replay. Audience members ran their own campaigns from the venue; complete ones auto-shared into the gallery.

**17 Jul 2026 — the outage and the migration.** The venue's polling traffic exhausted a free-tier database's egress quota (the SSE stream had been silently minting localhost URLs, so every viewer polled). Both were fixed for good: the SSE base URL and CORS allowlist shipped, and the entire dataset was migrated (pg_dump/restore, all counts verified) onto Campaign Lab's own Neon project, with the accidental personal-org database decommissioned.

**20 Jul 2026 — BYOK.** Public runs now require the visitor's own API key (decision ahead of the first newsletter): validated at the gate, AES-256-GCM-sealed at rest, per-run use only, deleted at every terminal state, excluded from house budget accounting. [PR #13](https://github.com/CampaignLab/campaign-factory/pull/13) added **OpenRouter** keys alongside Anthropic — provider detected by prefix, routed through OpenRouter's Anthropic-compatible endpoint, with server-side web search, effort, and prompt-caching passthrough probe-verified before merge.

**15 Jul 2026 — OpenClaw build reveal.** A separate, bounded coding agent ("Pip", outside the factory runtime) was provisioned to build a Campaign Operations workspace in public view for the conference: [issue #11](https://github.com/CampaignLab/campaign-factory/issues/11) and draft [PR #12](https://github.com/CampaignLab/campaign-factory/pull/12), demo-safe (browser-local fixture state, no real delivery), with visible commit-and-comment checkpoints. It demonstrates bounded build-time autonomy — it cannot merge, deploy, or touch production.

**Status.** The multi-agent factory is production on `main` (Vercel web + Railway worker + Neon Postgres), running on visitors' own keys. The legacy builder remains at `/legacy` as the comparison point. Open work is tracked in the [issues](https://github.com/CampaignLab/campaign-factory/issues).
