# Campaign Factory coding standards

These rules describe the architecture already established by the maintained application. Preserve them when changing `web/`, `worker/`, or shared factory modules. More specific child `AGENTS.md` files also apply.

## Repository boundaries

- `web/` is the production Next.js application. Keep route handlers and pages thin; put reusable policy, parsing, projections, and persistence in `web/src/lib`.
- `worker/` owns queues, LangGraph orchestration, model execution, recovery, and worker HTTP/SSE. It may reuse factory contracts and deterministic domain modules from `web/src/lib/factory` through the `@web/*` alias.
- `web/src/lib/factory/contracts` is the shared domain vocabulary. Contract modules must not import React, framework routing, database clients, or worker runtime code.
- `web/src/lib/factory/store` owns persistence by entity. Keep SQL and row mapping inside the relevant store module; callers orchestrate store functions rather than duplicating queries.
- Retired prototypes live in Git history, not in the working tree. Restore them
  only for a specific historical investigation; do not rebuild new features on
  those obsolete architectures.

## Established architectural patterns

- **Thin adapter:** routes, pages, and worker entrypoints authenticate, parse, and delegate. Reusable policy belongs in domain/application modules rather than entrypoints.
- **Contract → projection → renderer:** shared contracts define facts; pure folds, compilers, and view-model adapters derive display state; components render that state. Do not make renderers reinterpret transport events or persistence rows.
- **Entity-owned store:** each persisted entity has one store module that owns its SQL and row mapping. Cross-entity workflows compose those modules instead of adding a second query path.
- **Append-only event state:** factory events are both transport and audit history. Client state is a deterministic fold of ordered events, while accepted server state is changed through validated reducers.
- **Controller/render split:** hooks and controller components own transport, timers, subscriptions, and browser APIs. Presentational components receive data and callbacks.
- **Narrow platform adapter:** isolate repeated browser or runtime behavior behind a small typed module. For example, hydrate local-storage strings through `useStoredString` instead of mirroring storage into state in mount effects.
- **Small public surface:** barrels expose only an intentional feature API. Use direct imports for internal implementation and for values crossing the worker's NodeNext boundary.
- **Executable support root:** tests, checks, migrations, and scripts are first-class dependency roots even when production code does not import them. Keep them when they protect a current contract; delete them when that contract is removed.

When a product decision eliminates a mode, remove that mode end to end: implementation, types, limits, props, exports, CSS, fixtures, tests, and comments. Do not preserve it as no-op compatibility unless an identified external caller requires it.

## Dependency and module rules

- Keep dependency flow directed: route/UI adapter → application/domain function → contract or store. Pure domain modules must not depend on routes, components, or process boot code.
- Separate deterministic transformation from I/O. Event folds, reducers, receipt builders, document compilers, and view-model projections should be pure given their inputs; inject clocks or effects when needed.
- Use `import type` for type-only dependencies.
- In `web/`, prefer the `@/` alias across feature directories and relative imports within one cohesive directory.
- In `worker/`, use NodeNext `.js` specifiers and `@web/*` for shared web modules. Prefer direct value imports across package/ESM boundaries; use barrels only as small, intentional public surfaces. A barrel must not keep dead implementations alive.
- Do not retain no-op props, ignored options, duplicate contract types, or compatibility adapters without a current caller and a documented compatibility requirement.

## Next.js and React

- Pages and layouts are Server Components by default. Add `"use client"` only at the smallest boundary that needs state, effects, event handlers, or browser APIs.
- Keep fetching and transport in route/server modules or dedicated client controllers. Pure renderers receive serializable data and callbacks; they do not fetch.
- Treat App Router files and files under `public/` as convention-driven entrypoints/assets when auditing reachability. Verify framework conventions before declaring them unused.
- Treat local framework config as a possible workspace-isolation boundary. Before deleting an apparently empty config, check whether the framework would discover a parent workspace config instead.
- Effects synchronize with external systems. Do not use an effect solely to derive state that can be initialized or calculated directly.
- For values that arrive after hydration but remain user-editable, prefer a nullable local edit override (`edited ?? externalValue`) over an effect that copies props or storage into state.

## Factory state and orchestration

- Factory Events are the transport and audit log. Preserve event type, visibility, sequence, state-version, resend, and emission-order semantics.
- Event folding and reducers are deterministic. Never silently discard accepted content, unresolved work, or duplicate-sequence resends; terminal omissions become explicit gaps.
- Runtime agents propose work. Deterministic reducer/store code validates and applies it. Agents do not mutate accepted campaign state directly.
- Expected agent/model failures remain visible domain outcomes. Systemic failures should fail loudly for queue retry or dead-letter handling.
- Preserve idempotency around run delivery, checkpoint resume, cancellation, cost guards, and finalisation.

## Code shape

- Prefer cohesive modules, explicit control flow, early returns, and domain names over generic helpers or clever compression.
- Extract a helper when it names a stable responsibility or removes demonstrated repetition. Do not split large fixture/data files or collections of cohesive renderers merely to reduce line count.
- Comments should explain constraints, product decisions, security boundaries, event ordering, or non-obvious failure behavior. Remove stale workstream labels and comments that describe architecture which no longer exists.
- Keep exported surfaces minimal. Before adding or preserving an export, identify its caller; before deleting one, search direct, aliased, dynamic, framework, and cross-package references.

## Security and persistence

- Treat authentication, BYOK secrets, signing, spend limits, environment identity, database migrations, concurrency, and model routing as high risk.
- Never log or expose provider keys. Keep client-supplied values untrusted until server-side validation, and keep environment/provider selection server-owned.
- Migrations are append-only historical artifacts after deployment. Add a new migration instead of rewriting an applied one.

## Verification

- Run the narrowest relevant checks first, then expand when a boundary changes.
- Web baseline: `npm run lint` and `npm run build` from `web/`; use the Playwright factory suite when UI behavior or a live flow changes.
- Worker baseline: `npm run typecheck` from `worker/`; run the relevant executable check under `worker/src/**/__checks__` for agent, gateway, BYOK, routing, or boot changes.
- Add characterization tests before simplifying event folds, graph orchestration, persistence sequencing, retries, or other timing/order-sensitive code.
- For repository-wide cleanup, use the checked-in `code-simplifier` dependency audit, then semantically verify every deletion candidate. Reachability is evidence, not proof.
