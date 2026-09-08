# exec/ — the Workflow campaign executor (migration phase 2)

Campaign-run execution ported from the Railway worker so runs execute as Vercel
Workflows (`src/workflows/campaign.ts`). See
`docs/product/vercel-workflow-migration.md` for the plan and
`docs/product/factory-implementation-parameters.md` for run semantics.

## Provenance — keep diffs comparable

| Here | From (worker/src) | Change |
| --- | --- | --- |
| `agents/*` | `agents/*` | import paths only (`@web/lib/*.js` → `@/lib/*`); `useOpus` → `shouldUseOpus` (web lint) |
| `emit.ts` | `events/emit.ts` | import paths only |
| `gate.ts` | `gate.ts` | import paths only |
| `cost.ts` | `cost.ts` | import paths only |
| `review-contract.ts` | `graph/review-contract.ts` | import paths only |
| `nodes.ts` | `graph/nodes.ts` | mechanical: `(ctx, state)` params replace LangGraph config; Patch from `./state` |
| `finalise.ts` | `graph/finalise.ts` | same mechanical change |
| `state.ts` | `graph/state.ts` | LangGraph channels → plain `RunState` + `applyPatch` with identical reducer semantics |
| `context.ts` | `graph/context.ts` + `graph/run.ts` deps wiring | RunContext built per STEP; JudgementSlots unchanged |
| `loader.ts` | `graph/executor-loader.ts` | static imports (bundler); mock fallbacks dropped (modules always present) |
| `store.ts` / `db.ts` | `store/index.ts` / `db/pool.ts` | same store functions (they always lived in web); pooled client from `FACTORY_DATABASE_URL` |

The worker is FROZEN during the migration (rollback path). If you must fix a
bug in a copied file, fix it in BOTH trees and note it here.

## Known behavioural deltas vs the worker (accepted for phase 2)

- **Concurrency gate is per function instance**, not process-global: per-campaign
  caps hold (a campaign's cluster runs inside one step) but the global 25-call /
  10-research ceiling is per-instance. Phase 3: shared-store gate.
- **`work.update` coalescing is per step** (fresh Emitter per step), so slightly
  more work.update rows persist than on the worker. Cosmetic.
- **Step retries can duplicate events**: `appendEvent` is not idempotent, and a
  Workflow step that fails AFTER emitting will re-emit on retry (the worker had
  the same property at pg-boss whole-run granularity). Runs stay correct —
  events are folded last-write-wins — but backscroll rows can double. Phase 3
  option: per-emit steps or entry guards.
- **Cancellation lands at node boundaries** (guard() polls `factory_runs.status`);
  there is no in-process abort registry. Mid-step model calls run to completion.
- **BYOK is not supported on the workflow path**: workflow arguments persist
  unsealed in the Workflow backend, so a visitor key must never ride through
  them. House-key runs only until phase 3 designs an equivalent of the worker's
  AES-sealed-at-rest handling.
- **Mock-mode runs never reach `/gallery`** — the `cost_usd > 0.5` listing floor
  filters them, as it does fixture runs on the worker.
