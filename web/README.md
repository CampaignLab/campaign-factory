# Campaign Factory web app

The `web` package is the user-facing Next.js 16 application. It renders public
intake, live campaign assembly, presenter batches, replay, gallery, legacy, and
admin surfaces. Long-running campaign execution belongs to the separate
[`worker`](../worker/), not to Vercel functions.

## Boundaries

- `src/app` contains App Router pages and thin API gates/proxies.
- `src/components/factory` renders campaign state and view models.
- `src/lib/factory/contracts` is the runtime-neutral vocabulary shared with the
  worker.
- `src/lib/factory/store` owns factory SQL and row mapping by entity.
- `src/lib/factory/client` folds ordered Factory Events into browser state.
- `src/lib/factory/documents` compiles and renders campaign documents.

The web app signs worker requests with an HMAC secret. Browsers receive only a
run-scoped stream token for SSE and run mutations; the service secret never
crosses the server boundary.

## Local development

Prerequisites: Node 22+, npm, PostgreSQL, and the worker running on port 8787.

```bash
npm install
npm run dev
```

The app opens at [http://localhost:3000](http://localhost:3000). Put local
configuration in `.env.local`; it is ignored by Git.

Minimum factory configuration:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by web reads and legacy storage. |
| `FACTORY_DATABASE_URL` | Optional factory-specific connection; falls back to `DATABASE_URL`. |
| `FACTORY_SIGNING_SECRET` | Shared HMAC secret; must match the worker. |
| `FACTORY_ENV_ID` | Environment identity; must match worker and database marker. |
| `FACTORY_WORKER_URL` | Server-side worker URL, normally `http://localhost:8787`. |
| `NEXT_PUBLIC_FACTORY_WORKER_URL` | Browser-visible worker URL for SSE. |
| `FACTORY_BYOK_SECRET` | Shared secret used by the worker to seal visitor keys. |
| `CF_ADMIN_KEY` | Enables moderation and cost-admin routes. |

The worker owns `FACTORY_MODEL_MODE`. Use `mock` for ordinary development and
tests; use `live` only for intentional provider checks. See
[`../worker/.env.example`](../worker/.env.example) for the complete shared
configuration.

## Commands

```bash
npm run dev             # development server
npm run lint            # ESLint
npm run build           # production build + TypeScript validation
npm run start           # serve a completed production build
npm run test:factory    # Playwright factory suite; servers must already run
```

The end-to-end suite is intentionally serial because it uses a real queue and
database. Its fixtures, timeouts, and live/mock controls are in
[`tests/factory/README.md`](tests/factory/README.md). An isolated database is
recommended: every worker attached to one database can consume that database's
shared `pg-boss` queue.

## Route map

| Route | Purpose |
| --- | --- |
| `/factory` | Public BYOK intake. |
| `/factory/c/[campaignId]` | Live campaign assembly. |
| `/gallery` | Completed campaign gallery. |
| `/factory/multi-campaign-demo` | Presenter batch intake. |
| `/factory/gallery/[batchId]` | Presenter factory floor. |
| `/factory/live` | Latest batch spectator view. |
| `/factory/replay/conference` | Stored conference replay. |
| `/legacy` and `/c/[id]` | Maintained legacy builder and shared result. |
| `/admin` and `/factory/admin/costs` | Moderation and operational controls. |
| `/factory/dev/*` | Fixture previews with no model calls. |

## Deployment

The package deploys to Vercel with `web/` as the project root. The worker is a
separate Railway service built from the repository root because it imports
runtime-neutral modules from `web/src`. Set matching signing, environment,
database, worker URL, and BYOK secrets in both deployments.

Architecture decisions are in [`../docs/adr`](../docs/adr), and current limits
and measured results are in [`../docs/product`](../docs/product).
