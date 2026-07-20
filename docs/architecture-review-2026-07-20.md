# Architecture review — 20 Jul 2026

Method: the ["improve codebase architecture"](https://www.aihero.dev/skills-improve-codebase-architecture) deepening pass (Ousterhout lens): find **shallow modules** — interfaces as complex as their implementations — and **information leakage** (one piece of knowledge written in several places), prioritising code changed since 13 Jul. Two parallel read-only surveys (web app; worker + shared lib), synthesised and rated below.

## STRONG — do these

### S1. Give BYOK one home
The "what is a valid key / which provider / what does it cost" knowledge is written in three places and will drift:
- key-format regexes duplicated verbatim: `web/src/app/api/factory/runs/route.ts` (`detectProvider`) and `web/src/app/factory/page.tsx` (`keyLooksValid`)
- the "$1.50–$3, capped at $20" sentence, provider display names, and console URLs duplicated between server error copy and form copy
- the worker-side meta shape `{ byokRun, byokProvider, byok }` built untyped in `handlers.ts`, re-asserted with casts in `run.ts`, stripped in two places (`finalise.ts`, dead-letter in `run.ts`)

**Deepen:** `web/src/lib/byok.ts` owning `detectProvider()`, `providerMeta()` (name/console URL), the cost copy string, and `validateByokKey()`; worker `byok.ts` grows `RunByokMeta`, `sealIntoMeta()`, `openForRun()` (encapsulating the "byokRun but seal missing ⇒ systemic throw" rule). Size M, risk low–medium (validation return contract must stay byte-identical).

### S2. Decompose the intake route
`POST /api/factory/runs` is ~150 lines doing parsing, validation, admin auth, BYOK vetting (two external fetches), budget gate, atomic session+IP claim with refund choreography repeated in three failure branches, signed forward, cookie set. **Deepen:** `resolveByok()` (from S1) + `withRunSlots(sid, ip, caps, fn)` in `lib/db/sessions.ts` pairing claim+refund so a route can't forget a leg. Size M, risk medium — the claim-session-then-IP-refund-on-loss ordering is load-bearing (commit `7fb2411`).

### S3. Extract the gallery composition pipeline
`web/src/app/gallery/page.tsx` inlines: campaignKey normalisation, **two divergent grade-rank tables** (`MERGE_RANK` vs inner `rank`), the `TEST_SOLO_CUTOFF` constant, best-grade reduction, two cross-section fold passes, a `beats()` comparator, and the organizer/audience split — a pure data pipeline wearing a React page as its interface. **Deepen:** `composeGallery(factory, solo, legacy) → { organizerCards, audienceCards }` in a co-located pure module; unify the two rank tables. Size M, risk low, unit-testable afterwards.

### S4. Price usage inside the sink, not at every call site
`RecordUsage` demands a pre-priced `costUSD`, so pricing rules live at call sites: `model-call.ts` prices web search inline (`+ webSearches * (WEB_SEARCH_COST_USD / 4)` — magic `/4`), `qa.ts` re-builds the record *without* the search term, `pipeline/run.ts` prices again. **Deepen:** `recordModelUsage(ids, model, usage, { webSearches })` computes cost once, next to `costUSD`/`WEB_SEARCH_COST_USD` in `spend/pricing.ts`. Size S, risk low.

### S5. One source of truth for budget constants
- `COST_GUARDS.dailyProjectKillSwitchGBP: 150` in `contracts/limits.ts` is **dead (zero readers) and stale** — the live switch is `config.ts dailyBudgetGBP: 472.44`. A reader trusting the contracts file is off by ~3×. Delete it.
- The presenter $80 ceiling is defined twice independently (`limits.ts presenterBatchHardStopUSD` and `worker/config.ts presenterSpendCeilingUSD` default). Default the latter from the former. Size S, risk low.

## WORTH EXPLORING — cheap information-leakage batch

> **Status 20 Jul (evening):** W1–W7 all implemented (W6 conservatively: shared error taxonomy in `worker/src/agents/model-errors.ts`; the reviewer gained the dead-key fail-fast and overload pacing but deliberately keeps its single-retry character). The legacy `byokAnthropicKey` wire field was also removed. Only P1 remains open, by design.

- **W1. Campaign-id guard:** the UUID regex is written out five times across routes/pages (with the "non-UUID must 404, not 500 via Postgres 22P02" comment repeated); `isCampaignId()` + one 404 helper.
- **W2. Admin auth helper:** the `x-cf-admin-key` comparison is triplicated identically plus two divergent variants; `isAdminRequest(req)` beside `config.adminKey`.
- **W3. `needsSsl` / pg-connect idiom copy-pasted 5×** (`worker/config.ts`, `migrate.ts`, `db/spend.ts`, `db/client.ts`, `factory/store/client.ts`); the `ENV` name map in `contracts/api.ts` is documentation nothing imports.
- **W4. Small type-safety batch:** `/api/status` returns an untyped literal hand-mirroring the client's `StatusResp`; `parseSid` re-implements `readCookie`; the brief-register load sequence is duplicated between the campaign page and its server action (`loadBriefRegister()` once).
- **W5. `ModelClient` value object:** provider currently rides a WeakMap side-channel from `getClient()` to `call()`; a `{ provider, call() }` handle would carry it in the type. Touches every call site — do deliberately, not casually.
- **W6. Unified retry wrapper:** the executor's 3-rung ladder (+ error taxonomy) is private, so `reviewer.ts` re-implements a weaker retry and `qa.ts` has none. A `runModelTurnResilient(spec, deps, opts)` would host the taxonomy once — but the divergence may be intentional (reviewer deliberately cheap); validate first.
- **W7. Worker store barrel:** hand-maintained 40-export pass-through that product code already bypasses (`run.ts`/`finalise.ts` direct-import what it forgot); switch to `export *` + keep only the readiness probes, or drop it.

## SPECULATIVE — leave unless a reason appears

- **P1. Legacy run-cap migration:** `api/runs/route.ts` still uses the old non-atomic `incrRun` family (real TOCTOU gap, no refunds) that the factory route's atomic `claimRun` family replaced. But `/legacy` is intentionally frozen as the comparison point — migrate only if it ever comes back into use.
- **Thin factory proxy routes are correctly shallow** — each carries distinct auth (stream token vs presenter cookie); `forwardSigned` is already the deep interface. Do not collapse.
- `byokAnthropicKey` legacy field: cutover shim, removable in a future pass now web+worker are deployed together.
- Env-gated diagnostics (`FACTORY_DIAG*` taps) — harmless, remove eventually.

## Housekeeping (zero-risk)

1. Delete `web/web/` (wrong-cwd artifact: 7 stray screenshots) and `.playwright-cli/` (16 Jul scratch logs).
2. Delete `web/test-results/` after preserving `show-readiness-report.md` → `docs/product/`.
3. Gitignore the artifact dirs: `test-results/`, `playwright-report/` in `web/.gitignore`; `.playwright-cli/` at root.
4. Commit the two ad-hoc verify scripts (`web/scripts/verify-*.mjs`) with header comments — same convention as `worker/src/__checks__/` (kept: cheapest live diagnostics for BYOK/gateway paths).
5. Delete merged remote branch `feat/byok-openrouter`; local `fix/refresh-recovery-runid` still awaits a decision.
6. Delete dead `dailyProjectKillSwitchGBP` (part of S5).
