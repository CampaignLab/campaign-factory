# File-by-file simplification audit — 22 July 2026

## Outcome

The maintained executable code is mostly connected and purposeful. The audit found a small, high-confidence deletion tranche, one obsolete gallery architecture, one temporary worker adapter that outlived its purpose, and two complex deterministic cores that should be characterised before they are split. The dead-file and obsolete-gallery tranches have now been applied. A final repository cleanup also removed the tracked reference prototype and HTML archive as one product-level retirement; both remain recoverable from Git history. See `code-pattern-audit-2026-07-22.md` for the post-cleanup pattern pass.

The complete mechanical inventory is in [simplification-file-reachability-2026-07-22.md](simplification-file-reachability-2026-07-22.md). This document adds the semantic necessity judgement that a dependency graph cannot make.

## Scope and method

The depth-first pass covered 281 tracked or unignored executable files under:

- `web/src`, `web/scripts`, and `web/tests`
- `worker/src`
- `db/factory`
- `app` (the reference-only localhost prototype)

It excluded dependencies, generated output, ignored local credentials, narrative documentation, binary assets, and `archive/`. Configuration, deployment files, documentation, and public assets were reviewed separately where they define roots or revealed deletion candidates.

Runtime roots included Next.js route conventions, the worker and migration entrypoints, package scripts, legacy HTML/server entrypoints, and the worker agent barrel loaded through `executor-loader.ts`. Support roots included tests, checks, and scripts. The graph was walked in dependency-first DFS post-order.

Initial graph result:

| Initial disposition | Files |
| --- | ---: |
| Runtime-reachable | 253 |
| Support-only | 16 |
| Standalone migration | 5 |
| Unreachable candidate | 7 |

Seven unresolved edges are expected references to ignored `.env`/`local-key.js` files. No unresolved maintained source import remains.

## Final disposition rule

Every scanned file not named in a non-keep group below has final disposition **keep**. Its exact root, inbound/outbound edge count, size, and DFS order are recorded in the complete inventory. This makes the audit exhaustive without repeating 200-plus unremarkable `keep` rows here.

The five SQL migrations remain **keep / standalone artifact**. The sixteen support-only scripts and checks remain **keep / support-only**, except the two files explicitly marked for simplification below.

## Delete — high confidence

| File | Evidence | Verification after deletion |
| --- | --- | --- |
| `web/src/components/LabelChip.tsx` | No importer or runtime path; only a comment mentions its name. | Web lint, typecheck/build. |
| `web/src/components/Reveal.tsx` | No importer; also causes one current React lint error. | Web lint, route smoke. |
| `web/src/components/ui/accordion.tsx` | No importer. | Web lint, typecheck/build. |
| `web/src/components/ui/badge.tsx` | No importer. | Web lint, typecheck/build. |
| `web/src/components/ui/card.tsx` | No importer. | Web lint, typecheck/build. |
| `web/src/components/ui/separator.tsx` | No importer. | Web lint, typecheck/build. |
| `web/src/lib/factory/state/index.ts` | Unused four-line barrel; callers import `reducer` and `sections` directly. | Web and worker typechecks. |
| `web/src/components/factory/cards/CompactAgentCard.tsx` | Retained only by a barrel export; the approved gallery design is always expanded. | Gallery fixture/replay and batch UI checks. |
| `web/src/components/factory/cards/AgentIdentityPill.tsx` | Became unreachable once the compact-card-only path and stale barrel export were removed. | Web lint and build. |
| `web/src/components/factory/gallery/JudgementCard.tsx` | Retained only by a barrel export; judgement UI moved to `YourJudgementCard` on the brief. | Assembly judgement preview/check. |
| `web/src/components/factory/gallery/presentation.ts` | No caller; maps every card to expanded and exists only for obsolete API compatibility. | Gallery fixture/replay and batch UI checks. |
| `web/public/file.svg` | Default Next asset; no reference. | Build. |
| `web/public/globe.svg` | Default Next asset; no reference. | Build. |
| `web/public/next.svg` | Default Next asset; no reference. | Build. |
| `web/public/vercel.svg` | Default Next asset; no reference. | Build. |
| `web/public/window.svg` | Default Next asset; no reference. | Build. |

The eleven source files account for 681 lines. The five public SVGs are additional generated-template residue.

`web/next.config.ts` is **keep / workspace isolation**, despite having no local options. A deletion build proved that Next then discovers `../../next.config.ts` and inherits another app's experimental Server Action body limit and response-header setting. The local file is therefore an active boundary, not generated residue.

## Consolidate obsolete gallery presentation code

These files are reachable, but carry fields, props, handlers, exports, tests, or comments for compact/pill presentation and gallery judgement cards that no longer exist:

| Files | Final disposition | Required change |
| --- | --- | --- |
| `web/src/components/factory/gallery/FactoryGallery.tsx` | Simplify | Remove `completionReadableMs` and `onAnswerJudgement` no-op props and the now-unused judgement type import. |
| `web/src/components/factory/gallery/GalleryLive.tsx` | Simplify | Remove the judgement callback and request code passed into the no-op prop. |
| `web/src/app/factory/dev/gallery-preview/GalleryPreviewClient.tsx` | Simplify | Remove the no-op judgement logger prop. |
| `web/src/components/factory/gallery/index.ts` | Simplify | Remove dead component/presentation exports and keep only the externally imported surface. |
| `web/src/components/factory/cards/index.ts` | Simplify | Remove `CompactAgentCard`, `CardPresentation`, and unused adapter/helper exports. |
| `web/src/components/factory/cards/types.ts` | Simplify | Remove `CardPresentation` and presentation-priority fields that no renderer reads. Preserve `lastEventAt` and `isHandingOff`, which `AgentWorkCard` still uses. |
| `web/src/components/factory/cards/cardAdapter.ts` | Simplify | Remove the unused `adaptAgentCardVM` compatibility normaliser and stop deriving fields removed above. |
| `web/src/components/factory/cards/chrome.ts` | Simplify | Remove `COMPACT`; preserve shared ink, expanded size, mono style, and status colour. |
| `web/src/lib/factory/contracts/limits.ts` | Simplify | Remove unused compact, expansion-cap, completion-window, choreography, and workspace limit fields; retain limits with real callers. |
| `web/tests/factory/batch.spec.ts` | Correct stale contract | Replace the “never exceeds 10 expanded cards” assertion and summary fields with assertions for the approved always-open layout. |
| `web/tests/factory/factory.helpers.ts` | Simplify | Remove `totalExpanded` and stale comments if the cap assertion is removed. |
| `web/tests/factory/README.md` | Update documentation | Describe the always-open gallery contract instead of a ten-card cap. |

This is the clearest first implementation tranche because it deletes a complete obsolete concept rather than merely shortening individual functions.

## Consolidate the temporary worker runtime boundary

| Files | Final disposition | Required change |
| --- | --- | --- |
| `worker/src/graph/executor-loader.ts` | Consolidate | Replace the 261-line temporary dynamic/fallback implementation with a small typed adapter using direct agent-module imports. Delete its duplicate mock executor/reviewer; the real modules already own mock mode. |
| `worker/src/graph/review-contract.ts` | Consolidate | Remove duplicated W2/W3-era types or reduce them to the minimal graph-facing projection still required. |
| `worker/src/agents/index.ts` | Consolidate or delete | It currently exists for the computed loader import. After direct imports, retain only genuinely useful public exports or delete the barrel. |
| `worker/src/graph/context.ts` | Simplify with boundary | Use the authoritative agent function types after the adapter is reduced. |
| `worker/src/graph/run.ts` | Simplify with boundary | Import the reduced runtime dependency type from its final owner. |
| `worker/src/index.ts` | Simplify with boundary | Remove the stale “w3 when present; local mock otherwise” boot comment and loader assumptions. |

Direct module imports are required here. A recent store-barrel ESM boot regression shows that replacing this with another broad value barrel would be unsafe. Verification must include worker typecheck, the 97-case agent check, store-barrel load, mock worker boot, and container boot.

## Simplify after characterisation tests

| File | Why it is a hotspot | Safe boundary |
| --- | --- | --- |
| `web/src/lib/factory/client/fold.ts` | `applyEvent` is 256 lines and handles lifecycle, evidence, sections, documents, judgements, agents, and backscroll in one function. | Add event-sequence/resend fixtures, then extract cohesive mutators while retaining one ordered orchestrator. |
| `worker/src/graph/nodes.ts` | `runAgent` is about 270 lines and the reviewer closure about 369 lines, combining policy, persistence, state mutation, and event emission. | Characterise time/cancel/cost halts, express dissent, revision routing, reducer rejection, and emitted-event order before splitting. |
| `web/src/lib/factory/client/useFactoryRun.ts` | One effect owns ingestion, SSE, polling, timers, reconnection, visibility sync, and cleanup. | Extract an imperative transport controller; leave React state and public hook behaviour intact. |

These are high-value simplifications, but deleting branches or changing order by inspection would be unsafe.

## Small local simplifications

| File | Final disposition | Change |
| --- | --- | --- |
| `web/src/lib/factory/documents/language.ts` and its callers | Simplify | Remove the ignored `_flagged` parameter and stop passing advisory-flag booleans to `documentPill`; status alone intentionally determines the pill. |
| `web/scripts/verify-judgement.mjs` | Simplify | Remove `sawAnyCard`, which is assigned but never read. |
| `web/src/app/factory/page.tsx` | Simplify | Extract the duplicated Anthropic/OpenRouter link pair without changing the surrounding error/helper copy. Preserve the user's current uncommitted edits. |
| `web/src/app/admin/page.tsx` | Simplify / lint repair | Isolate initial local-storage hydration so the effect does not synchronously set state. |
| `web/src/components/CampaignApp.tsx` | Simplify / lint repair | Isolate access-code hydration while preserving the separate asynchronous run-recovery behaviour. This is legacy code, so keep the change narrow. |

## Retired as a product-level unit

All fifteen scanned executable files under `app/` were reachable from their legacy HTML/server roots, but no maintained application, deployment, or fallback used them. The current fallback is `/legacy` inside the Next.js app. Their final disposition is therefore **delete as one retired product**, not incremental refactoring.

The 33 tracked `archive/` files were earlier HTML prototypes with no runtime or deployment caller. They were removed in the same tranche. Both trees remain recoverable from repository history; ignored local credential files were deliberately left untouched.

## Large files intentionally kept

- `web/src/components/factory/assembly/SectionContent.tsx` is large because it contains separate domain renderers, not one tangled function.
- `web/src/lib/factory/documents/render.ts` and `compile.ts` are collections of pure document renderers/compilers with meaningful format boundaries.
- `web/src/lib/factory/client/fixtures.ts` and `worker/src/agents/mock.ts` are mostly fixture data.
- SQL migrations are ordered historical artifacts and should not be deduplicated after deployment.

Size alone is not a reason to split these files.

## Implementation order

1. **Completed:** delete the confirmed dead source/assets and repair web lint.
2. **Completed:** remove the obsolete gallery presentation concept and update its tests/docs.
3. Collapse the temporary worker executor boundary with direct imports and boot checks.
4. Add fold characterisation tests, then split `applyEvent`.
5. Add graph orchestration characterisation tests, then split `runAgent` and the reviewer node.
6. Extract the live transport controller from `useFactoryRun`.

## Verification after repository cleanup

- Fresh depth-first traversal reports 235 runtime files, 16 support-only files, five standalone migrations, and zero unreachable candidates.
- Web lint and the Next.js production build pass.
- Worker TypeScript check passes.
- Document compiler/render checks pass.
- Deleted-symbol/reference searches and `git diff --check` pass.
- The public Playwright flow passes in mock mode and now requires a real
  `agent.started` state before success; accepted test runs clean themselves up.
- A live BYOK browser run was separately confirmed through stored run metadata
  and events, then cancelled.
