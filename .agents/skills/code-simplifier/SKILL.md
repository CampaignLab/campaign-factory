---
name: code-simplifier
description: Refine code and architecture for clarity, consistency, and maintainability while preserving observable behavior; discover recurring code patterns, turn them into repository standards, and audit repositories file by file for unused or unnecessary code. Use after implementing a change, before handoff, or when asked to simplify, clean up, refactor, standardize architecture, identify or document coding patterns, find dead code, audit reachability, or make code easier to understand. Default to code changed in the current task; run repository-wide pattern or file audits only when the user asks.
---

# Code Simplifier

Improve the code's expression without changing what users, callers, tests, APIs, persistence, or operations observe. Prefer straightforward, explicit code over fewer lines or clever abstractions.

## Establish the scope

1. Identify code changed for the current task from the conversation and edits made in this session.
2. Use `git diff` and `git status` as supporting evidence, not as proof that every dirty file belongs to the current task. Preserve unrelated user changes.
3. Read the applicable `AGENTS.md` files, formatter and lint configuration, nearby code, and relevant framework documentation. Treat other project guidance such as `CLAUDE.md` as supplementary when it is clearly applicable and does not conflict with Codex instructions.
4. Keep the pass local to recently touched code unless the user explicitly requests broader cleanup.

## Derive architectural patterns and standards

For a repository-wide pattern or architecture audit, infer standards from maintained code before proposing a target architecture.

1. Inspect representative examples at each active seam: entrypoints/routes, shared contracts, deterministic transformations, persistence, state/event handling, controllers/hooks, renderers, platform adapters, public barrels, and executable checks.
2. Name a pattern only when multiple examples or an explicit product constraint support it. Separate intentional invariants from incidental repetition, generated defaults, legacy residue, and one-off workarounds.
3. Record each pattern as evidence plus a rule. Cover ownership, dependency direction, state authority, I/O boundaries, public surfaces, failure behavior, retirement of obsolete modes, and required verification.
4. When the user requests durable standards, merge concise rules into the applicable `AGENTS.md`; do not replace existing guidance. Keep volatile audit counts and file-by-file findings in a separate audit artefact.
5. Use the documented standards as a decision function: retain code that expresses a useful boundary, and simplify deviations that add duplicate ownership, stale modes, effect leakage, broad exports, or unnecessary adapters.

Common healthy shapes to confirm rather than assume include thin entry adapters, contract → pure projection → renderer flows, entity-owned stores, append-only event state, controller/render separation, narrow platform adapters, and small intentional public surfaces.

## Audit a repository file by file

When the user requests a whole-codebase, dead-code, or file-by-file audit, use a guarded depth-first audit. Treat reachability as evidence, never as proof of necessity.

1. Define the maintained scope. Separate production code, framework entrypoints, workers, scripts, tests, migrations, generated output, vendored code, fixtures, prototypes, and archives. State exclusions.
2. Identify roots before traversing: package scripts, application routes, server and worker entrypoints, framework-convention files, HTML entrypoints, tests/checks, migrations, build/deployment configuration, computed or dynamic imports, and explicitly documented executables.
3. Build the internal dependency graph and traverse depth first from runtime roots. Traverse again from support roots such as tests and scripts. Use `scripts/dependency-audit.mjs` for JavaScript/TypeScript repositories when applicable.
4. Give every maintained file one initial disposition:
   - `runtime-reachable`: reached from a production or framework root.
   - `support-only`: reached only from tests, checks, fixtures, or scripts.
   - `standalone-artifact`: independently consumed configuration, migration, HTML, or similar artefact.
   - `unreachable-candidate`: no discovered path from a known root.
5. Verify every `unreachable-candidate` semantically. Search exact paths, basenames, exported names, route conventions, package/config references, dynamic imports, reflection, registries, CSS selectors, HTML references, subprocess calls, deployment commands, and documentation. Check whether an apparently empty local config prevents framework discovery of an ancestor/workspace config. Inspect git history only to understand intent; current behavior remains authoritative.
6. Walk retained files in dependency order, children before parents. For each file ask:
   - What root or caller needs it?
   - What observable responsibility does it own?
   - Are its exports and side effects consumed?
   - Is it a redundant adapter, compatibility layer, duplicate implementation, or pass-through barrel?
   - Could it be deleted, consolidated, or made smaller without obscuring domain boundaries?
7. Within each retained file, repeat the check for exported symbols and cohesive sections. Trace callers before marking a symbol, branch, parameter, fallback, or compatibility path unused. Prefer compiler-aware tools where available; confirm their findings with repository search because dynamic and cross-package imports create false positives.
8. Record one final disposition per file: `keep`, `simplify`, `consolidate`, `delete`, `quarantine`, or `investigate`. Include confidence, evidence, risk, and required verification for every non-`keep` result.
9. Rank implementation tranches. Start with verified dead files and stale public surfaces, then remove one obsolete concept end to end, then make low-risk local simplifications. Add characterization tests before high-risk orchestration, persistence, concurrency, retry, ordering, security, or cross-runtime changes.
10. After applying deletions, rerun the traversal with the same roots. Label the original inventory as a baseline and report the post-cleanup result separately.

Run the dependency audit from the repository root, passing all maintained source roots and relevant TypeScript configs. For example:

```sh
node .agents/skills/code-simplifier/scripts/dependency-audit.mjs \
  --scan web/src --scan worker/src --scan web/scripts --scan web/tests \
  --tsconfig web/tsconfig.json --tsconfig worker/tsconfig.json \
  --entry worker/src/index.ts --format markdown
```

The script reports file reachability and unresolved internal edges. It cannot determine product necessity, runtime reflection, or whether a reachable abstraction is still useful. Never delete code solely because the script labels it unreachable.

## Remove obsolete concepts end to end

When a product decision has eliminated a mode or architecture, remove the whole concept instead of leaving no-op compatibility:

1. Establish the current behavior and identify any external callers or compatibility promise.
2. Search for the concept's symbols and vocabulary across implementations, types, props, adapters, constants/limits, barrels, styles, fixtures, tests, scripts, comments, and documentation.
3. Delete the retired implementation and narrow every dependent surface. Do not retain ignored options, no-op callbacks, dead request paths, or exports whose only caller was the removed mode.
4. Update tests to assert the current product contract; do not keep tests for behavior the product explicitly retired.
5. Exercise the changed functionality through its narrow behavioral test, executable check, API smoke test, or browser flow.
6. Run deleted-symbol, asset-reference, and stale-language searches after the edit.

If an unknown external consumer may exist, preserve or deprecate the public contract explicitly rather than assuming it is internal.

## Simplify safely

- Reduce avoidable branching, nesting, duplication, indirection, and temporary state.
- Improve names and group related logic when the result is easier to follow.
- Remove comments that merely narrate the code; retain comments that explain intent, constraints, risk, or non-obvious decisions.
- Prefer explicit control flow to nested ternaries, dense expressions, or implicit side effects.
- Preserve useful boundaries between concerns. Do not collapse an abstraction solely to reduce line count.
- Follow the repository's established patterns instead of imposing generic preferences about function syntax, import style, component structure, or error handling.
- Avoid speculative generalization. Introduce an abstraction only when the changed code demonstrates a real repeated concept.
- Prefer one authoritative owner for contracts, persistence, state transitions, and platform behavior. Remove duplicate interpretations rather than synchronizing them.
- Keep framework/runtime effects in controllers, hooks, routes, or narrow adapters; keep deterministic projections and renderers free of I/O.
- In React, do not copy props or browser storage into state from an effect solely to derive an initial value. Reuse the repository's hydration-safe external-store adapter, or introduce a small one when repetition justifies it; model user edits as an explicit override when appropriate.
- Keep barrels intentionally small. A barrel is not a reason to retain an otherwise dead implementation, especially across ESM/package boundaries.
- Keep public types, function signatures, exports, error behavior, ordering, timing-sensitive behavior, data formats, database effects, and accessibility semantics stable unless the task explicitly allows a change.
- Treat authentication, authorization, billing, persistence, migrations, concurrency, external API calls, prompts, and model-routing logic as high risk. Make only clearly behavior-preserving edits there.
- Treat convention-driven routes/assets and apparently empty framework config as semantic candidates. For config deletion, compare framework startup/build output before and after and inspect parent workspace discovery.

## Verify equivalence

1. Review the final diff and trace each simplification back to an intended behavior-preserving improvement.
2. Build a change-to-functionality map: for every changed behavior surface, identify the user flow, API contract, state transition, renderer, worker path, or operational behavior that could regress and select a direct test for it.
3. Run the narrowest functional tests first. Prefer an existing unit/integration test, executable check, API smoke, or browser flow that actually exercises the changed path. Add a focused characterization test when risky behavior lacks coverage. Lint, typecheck, and build checks do not substitute for this pass.
4. Run the relevant formatter, lint, typecheck, and build checks. Follow the commands documented by the repository.
5. Expand functional and structural verification when the change crosses module boundaries or affects a high-risk area. Compare before/after framework output when deleting convention or isolation files.
6. Rerun reachability and stale-reference searches after repository-wide deletion tranches.
7. If a required functional test depends on an unavailable server, browser, service, fixture, or credential, try the safe in-scope setup when authorized. Otherwise record the exact functionality left untested and do not represent compilation as behavioral coverage.
8. If equivalence cannot be established confidently, revert that simplification or leave the code unchanged. Record useful false positives as standards so future audits do not repeat them.
9. Report the meaningful simplifications and verification performed. Mention every verification gap plainly and state that tracked deletions are recoverable through Git.

For repository-wide audits, also report the maintained scope, root assumptions, pattern evidence and resulting standards, every file disposition (directly or in an audit artefact), candidate false positives, applied and deferred tranches, baseline and post-cleanup reachability, and the safe next implementation order.

Do not rewrite stable code merely to express a personal style preference. A successful pass may conclude that no simplification is warranted.
