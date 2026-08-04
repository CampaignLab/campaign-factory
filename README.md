# Campaign Factory

Campaign Factory turns a UK local or public-policy problem into a researched
campaign plan. A visitor supplies a problem, a named place, and an Anthropic or
OpenRouter API key; the app researches the decision route, maps power and
pressure, proposes strategy and tactics, and drafts campaign materials while
showing the work as it happens.

The public app is [campaign-factory.vercel.app](https://campaign-factory.vercel.app).
AI-generated material can be wrong and must be checked before use.

## How it works

```text
Browser → Next.js web app → signed worker API → durable queue → LangGraph
   ↑                                  ↓                         ↓
   └──── SSE events / polling ── PostgreSQL events ← agents + checkpoints
```

1. The Next.js app validates the intake and API key, applies access and spend
   controls, then signs a request to the worker.
2. The worker creates a durable `pg-boss` job and runs the campaign graph. It
   checkpoints at node boundaries so interrupted work can resume.
3. Thirteen fixed agent responsibilities and one or two selected research
   specialists contribute to a shared, versioned campaign state.
4. Append-only Factory Events stream back to the browser. The same event fold
   drives live campaigns, presenter batches, and recorded replay.
5. Deterministic finalisation publishes finished work, records unresolved work
   as Terminal Gaps, and produces documents and completion receipts.

The core rule is honesty over polish: no fabricated fallback content. Claims
carry verification labels, unresolved facts use `[VERIFY: …]`, and failed or
unfinished work remains visible.

## Main components

| Path | Responsibility |
| --- | --- |
| [`web/`](web/) | Next.js 16 app: intake, live assembly, gallery, presenter, replay, legacy builder, and API gates. |
| [`worker/`](worker/) | Always-on Node worker: queue, LangGraph, model calls, recovery, checkpoints, and SSE. |
| [`web/src/lib/factory/`](web/src/lib/factory/) | Shared contracts, stores, event fold, document compiler, and deterministic domain logic. |
| [`db/factory/`](db/factory/) | Versioned PostgreSQL migrations for factory data. |
| [`docs/adr/`](docs/adr/) | Architecture decisions and their trade-offs. |
| [`docs/product/`](docs/product/) | Product parameters, build plan, and measured verification results. |
| [`assets/`](assets/) | Original workshop and research source material. |

The root [`AGENTS.md`](AGENTS.md) documents the coding standards discovered in
the architecture audit. Retired prototypes are available in Git history rather
than duplicated in the working tree.

## Run locally

Prerequisites: Node 22+, npm, and PostgreSQL. Mock mode is the safest default:
it exercises the full graph, queue, database, event stream, and UI without
calling a model.

```bash
# Worker
cd worker
npm install
cp .env.example .env
# Set DATABASE_URL, FACTORY_SIGNING_SECRET, and FACTORY_MODEL_MODE=mock.
npm run start

# Web, in another terminal
cd web
npm install
# Add DATABASE_URL, FACTORY_SIGNING_SECRET, FACTORY_ENV_ID,
# FACTORY_WORKER_URL=http://localhost:8787, and
# NEXT_PUBLIC_FACTORY_WORKER_URL=http://localhost:8787 to .env.local.
npm run dev
```

Open [http://localhost:3000/factory](http://localhost:3000/factory). The worker
listens on port 8787 and applies factory migrations on boot by default.

`FACTORY_SIGNING_SECRET` and `FACTORY_ENV_ID` must match across both processes.
The database environment marker must also match, otherwise the worker fails
closed. See [`worker/.env.example`](worker/.env.example) and the component
READMEs for the full configuration.

For live mode, set `FACTORY_MODEL_MODE=live` and configure the server-side
Anthropic key used by presenter runs. Public keys are validated, AES-256-GCM
sealed before persistence, decrypted only for their run, and removed when the
run reaches a terminal state. `FACTORY_BYOK_SECRET` is required; the worker
refuses BYOK runs if sealing is unavailable.

Use an isolated development database for deterministic end-to-end tests.
Workers connected to the same database consume the same `pg-boss` queue, even
when they run on different machines.

## Verify changes

```bash
cd web
npm run lint
npm run build
npm run test:factory       # requires web :3000 and worker :8787

cd ../worker
npm run typecheck
FACTORY_MOCK_FAST=1 npx tsx src/agents/__checks__/gateway-and-labels.ts
```

The Playwright suite and its environment controls are documented in
[`web/tests/factory/README.md`](web/tests/factory/README.md). Start with mock
mode; use a live key only for an intentional, budgeted provider check.

## Useful routes

| Route | Purpose |
| --- | --- |
| `/factory` | Public single-campaign intake. |
| `/factory/c/[campaignId]` | Live Campaign Assembly View. |
| `/gallery` | Completed public and organiser campaigns. |
| `/factory/multi-campaign-demo` | Presenter desk for batches of one to five campaigns. |
| `/factory/live` | Read-only view of the latest presenter batch. |
| `/factory/replay/conference` | Recorded conference replay, with no model calls. |
| `/legacy` | Maintained single-agent comparison/fallback. |
| `/admin` and `/factory/admin/costs` | Moderation and cost controls. |

## Analytics

Page analytics use self-hosted [Umami](https://umami.is) — cookieless and
GDPR-friendly, collecting aggregate pageviews rather than personal data. The
dashboard is at
[sugaroverflow-analytics.up.railway.app](https://sugaroverflow-analytics.up.railway.app)
(a standalone instance shared across the maintainer's sites; ask
[@sugaroverflow](https://github.com/sugaroverflow) for access). Its data lives
in a dedicated Neon Postgres, fully separate from the app database.

The tracker only loads when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set (Vercel
Production only), so local dev and preview deployments record nothing. The
script and its collection endpoint are proxied through the app's own origin via
the `/stats/*` rewrites in [`web/next.config.ts`](web/next.config.ts) so
ad-blocker blocklists don't filter them.

## Further reading

- [`HOW_IT_WAS_BUILT.md`](HOW_IT_WAS_BUILT.md) — project story and architecture
- [`PLAN.md`](PLAN.md) — product decisions and scope
- [`EXECUTION_JOURNAL.md`](EXECUTION_JOURNAL.md) — chronological engineering log
- [`docs/code-pattern-audit-2026-07-22.md`](docs/code-pattern-audit-2026-07-22.md) — simplification and standards audit
- [`docs/simplification-file-audit-2026-07-22.md`](docs/simplification-file-audit-2026-07-22.md) — file-by-file necessity audit
