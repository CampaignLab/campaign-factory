# Code-pattern and architecture audit — 22 July 2026

## Outcome

The maintained application has a coherent architecture: thin runtime adapters, shared contracts, deterministic projections, entity-owned stores, append-only event state, controller/render separation, and deliberately small public surfaces. The main deviation was the gallery retaining an obsolete compact/pill/judgement presentation system after the product moved to always-open cards.

This pass documented those patterns in the root `AGENTS.md` and applied them to the low-risk architecture tranche. It removed the obsolete presentation mode end to end, deleted unrelated dead UI residue, narrowed feature barrels and contracts, and consolidated repeated browser-storage hydration behind one adapter.

## Scope and method

The pass reused the repository's guarded code-simplifier audit:

1. Re-established runtime, framework, worker, script, test, migration, prototype, and computed-import roots.
2. Re-ran dependency-first DFS over `web/src`, `worker/src`, `web/scripts`, `web/tests`, `app`, and `db/factory`, then reran the maintained scope after retiring the prototype.
3. Reviewed representative files at each architectural seam rather than treating reachability as proof of necessity.
4. Traced obsolete symbols through callers, barrels, CSS, tests, fixtures, comments, and public assets before deletion.
5. Preserved high-risk orchestration and persistence code where characterization coverage is still the safer prerequisite.

Post-cleanup traversal:

| Disposition | Files |
| --- | ---: |
| Runtime-reachable | 235 |
| Support-only | 16 |
| Standalone migration | 5 |
| Unreachable candidate | 0 |

The five unresolved edges are expected references to ignored `.env.local` files. The worker agent barrel remains an explicit root because its computed loading cannot be inferred mechanically.

## Observed patterns and resulting standards

| Pattern | Evidence in the codebase | Standard applied |
| --- | --- | --- |
| Thin adapters | App Router handlers delegate to `web/src/lib`; worker boot delegates to graph/runtime modules. | Entrypoints parse, authorize, and delegate. Reusable policy stays below them. |
| Shared domain vocabulary | Factory API, event, state, evidence, document, journey, and roster types live in `web/src/lib/factory/contracts`. | Contracts remain framework-, UI-, database-, and worker-runtime-free. |
| Deterministic projections | Event folds, card adapters, document compilers, receipt builders, and campaign grades are pure transformations. | Keep I/O outside projections and inject time/effects when required. |
| Entity-owned persistence | Store modules group SQL and row mapping by run, event, claim, proposal, section, and related entities. | Compose store APIs; do not duplicate queries in routes or graph nodes. |
| Append-only event state | Ordered events drive client folds, audit history, resend handling, and receipts; reducers validate accepted state. | Preserve sequence, version, visibility, resend, and emission order. Agents propose; deterministic code applies. |
| Controller/render split | Live hooks/controllers own SSE, polling, timers, storage, and callbacks; gallery/cards/documents render view models. | Browser and transport behavior belongs in hooks/controllers; renderers stay effect-free. |
| Small public surfaces | Feature barrels expose contracts or a few entry components; worker value imports must respect NodeNext ESM. | Remove stale exports and use direct imports across package/runtime boundaries. |
| Support code as a root | Executable checks and Playwright specs protect current behavior even without production importers. | Audit tests/scripts separately; update or delete them with the contract they represent. |
| Product-level retirement | The old `app/` and HTML archive had no maintained runtime or deployment consumer. | Retire or revive obsolete trees as one product decision; do not incrementally refactor them. Keep history in Git. |

## Simplifications applied

### Removed obsolete gallery architecture

- Deleted the compact card, its identity pill, the old gallery judgement card, and presentation selector.
- Removed compact/pill types, priority fields, adapter compatibility paths, limits, no-op props, dead request handling, CSS, receipt variants, and stale comments.
- Narrowed the cards and gallery barrels to their actual consumers.
- Updated the Playwright contract from a ten-expanded-card cap to the approved rule that every agent card remains full width.

### Removed confirmed dead residue

- Deleted unused `LabelChip`, `Reveal`, accordion, badge, card, separator, and the unused factory-state barrel.
- Deleted five unreferenced default Next.js SVG assets.

The visually empty `web/next.config.ts` was tested as a deletion candidate and retained. Without it, Next discovers `../../next.config.ts` and inherits another app's Server Action body limit and header configuration. The local wrapper is a workspace-isolation boundary.

All deleted files are tracked by Git and recoverable from repository history.

### Retired duplicate prototype trees

- Removed the original localhost `app/` and the earlier HTML `archive/`; neither
  was deployed or used by the maintained `/legacy` fallback.
- Updated the one executable check that still read a credential from the old
  prototype location to use the current `web/.env.local` boundary.
- Preserved ignored local credentials, research inputs, ADRs, product records,
  and the separate ignored Campaign Ops staging workspace.

### Consolidated repeated client-state behavior

- Added `useStoredString` as the hydration-safe local-storage read adapter.
- Changed the admin key and campaign access code to use an external value plus nullable user-edit override instead of copying storage/props into state from an effect.
- Kept asynchronous run recovery as an effect because it genuinely synchronizes with persistence and transport.

### Reduced misleading APIs

- Removed the ignored advisory-flag argument from `documentPill`; document status remains its single source of truth.
- Removed an assigned-but-unread judgement verification variable and other unused exports/constants found during the pass.

## Deliberate deferrals

- `worker/src/graph/executor-loader.ts`, graph nodes, and event-fold internals cross ordering, ESM boot, retry, persistence, and model-runtime boundaries. Simplify them only after the characterization and boot checks listed in the file audit.
- `useFactoryRun` combines several external synchronization mechanisms. Extracting an imperative transport controller remains valuable, but it should be a dedicated behavior-tested change.
- Large renderer, compiler, and fixture files remain cohesive; line count alone is not an architectural defect.
- Retired prototypes remain available from Git history if a specific
  historical investigation needs them.

## Verification

- Fresh dependency audit: 256 maintained scanned files, zero unreachable candidates, five expected ignored-environment edges.
- `web`: ESLint passed; Next.js 16 production build and TypeScript compilation passed.
- `worker`: TypeScript check passed.
- Document compiler/render executable check passed in full, including the simplified document-pill contract.
- Deleted-symbol and asset-reference searches found no maintained callers; `git diff --check` passed.
- Factory fixture checks covered 23 always-open agent cards, browser storage
  hydration, and a zero-console-warning gallery. The strengthened public
  Playwright flow passed in mock mode.
- A live BYOK browser run used the local Anthropic credential, reached real
  model-backed agent, evidence-search, fetch, and cost events, and was then
  cancelled. The production build completed every application route. Next
  emitted only the existing multiple-lockfile workspace-root warning.
