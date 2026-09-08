# Execution Journal — Campaign Factory production build

A chronological log of what was executed, decided, and verified while turning the
`app/` prototype into a production application. Product plan: [`PLAN.md`](PLAN.md).
App + technical requirements: [`web/README.md`](web/README.md).

> Note: created manually — the referenced "execution journal" skill wasn't available
> in the session. Format can be adjusted to match a specific skill later.

---

## Session — 13 Jul 2026

**Goal:** rewrite the localhost single-presenter prototype into a public, self-serve
Next.js app on Vercel for a ~45-person conference launch.

### Decisions locked (grilling)
Public self-serve · design for simultaneous load · durable background-job runs ·
conference access code + 3-runs/session cap + £150/day spend kill-switch · full
Next.js/TS rewrite (UX journey is the spec, not the pixels; awake-style scroll-reveal) ·
server-side persistence + shareable URLs + opt-in wall (opt-in + admin hide) ·
**no synthetic data, ever** · desktop-first (entry/progress phone-usable) · 4-week
sunset tail · BYOK later. Model routing (designed by Fable, adopted): Stage A research
= Sonnet 5 (web search, 7-label enum); Stage B plan = Opus 4.8 (never downgraded);
Stage C drafts = Sonnet 5 ×3 parallel groups; lint = Haiku 4.5. No Fable 5 in-pipeline.

### Milestones executed

| # | What | Verified | Commit |
|---|---|---|---|
| M1 | Scaffold (Next 16/React 19/Tailwind v4) + routed pipeline ported to `web/src/lib/pipeline/`; per-run API-key seam; no-synthetic failure model; `POST /api/runs`, `GET /api/runs/[id]` | Live run: 13 real sources w/ labels, researched decision-maker, 3 draft groups, 13 `[VERIFY:]`, Haiku lint ok | `d9deeaa` |
| M2 | Launch controls: access code, session cap, £150 spend kill-switch, readonly; spend ledger + usage cost threaded through all stages; `/api/status` | All 4 gate branches + status verified (free, no key) | `d9deeaa` |
| M3 | Journey UI: EntryForm, RunProgress (ticker + live feed), scroll-reveal Journey (labels, `[VERIFY:]`, 9 docs w/ copy+download, sources filter), CampaignApp phases + gate + capacity | SSR entry surface; full journey rendered from real data via `/dev/preview` | `e292350` |
| — | Interim `/c/[id]` shareable page + dev preview harness + real fixture | — | `5d03aa5` |
| M4 | Postgres persistence (portable driver): runs/spend/sessions/wall; write-through store; `/c/[id]` durable DB read; removed in-memory shims | Verified vs local Docker Postgres and (later) Neon | `37dea4d` |
| M5 | Conference wall + admin: `owner_sid`, share/unshare, owner delete, admin hide, `/wall`, `/wall/projector`, `/admin`, OwnerBar | Full flow vs Postgres: ownership 403s, share, wall page, admin hide (wrong/right key), delete→404 | `b02afc8` |
| — | Wire wall into UX (landing + capacity links) | build | `f03c795` |
| M4b | Serverless execution via `after()` + `maxDuration`; README (Vercel setup + go-live reqs); Neon connectivity check | `after()` refactor builds; Neon PostgreSQL 17 verified | `559050d`, `84a36ca` |

### Infrastructure
- **GitHub:** pushed to `sugaroverflow/campaign-factory` (public), `main`.
- **Vercel:** project `sugaroverflow/campaign-factory` linked; **git-connected** for
  auto-deploys; Root Directory set to `web`. Env vars set (production):
  `ANTHROPIC_API_KEY`, `CF_ACCESS_CODE=CAMPAIGN-LAB`, `CF_ADMIN_KEY`, plus Neon vars.
- **Database:** Neon (`neon-claret-kettle`) provisioned via Marketplace; pooled
  `DATABASE_URL` across all environments; DB layer verified against Neon.
- **First deploy:** `campaign-factory-*.vercel.app` (behind deployment protection).

### Constraints found (see `web/README.md` → go-live requirements)
1. **Hobby plan caps functions at 300s** — full runs are 6–15 min, so they can't
   complete in one function on Hobby. Needs Vercel Workflow (durable steps) and/or a
   higher plan. (Vercel account to be switched later.)
2. **Vercel Deployment Protection is ON** — app not publicly reachable until disabled;
   the app's own `CF_ACCESS_CODE` gate is the intended access control.
3. Timing: the Opus plan stage is the long pole and variable (~3–10 min).

### Spend
≈ $0.66 (two live pipeline runs for verification; the deployment has not run a live campaign).

### Outstanding
- Go-live hardening: durable execution (Vercel Workflow) + disable deployment
  protection + confirm real access code + plan/`maxDuration`.
- M6: Stage-A label-quality test (Sonnet vs Opus), ~45-run load rehearsal, per-run cost
  measurement, seed rehearsal campaigns.

---

## 2026-07-15T15:52:04Z - OpenClaw Campaign Operations Build Reveal

### Goal

Provision a persistent external OpenClaw coding agent that opens an issue and draft PR, builds a visually native Campaign Operations workspace, and increases its heartbeat cadence for the conference demo.

### Changes

- Added the isolated OpenClaw agent `campaign-ops` (identity: Pip 🍬 of the Bon Bon Bureau of Agents, model: `openai/gpt-5.5`) on `openclawserver`, with its own workspace and clone of `CampaignLab/campaign-factory`.
- Installed a durable task contract covering issue-first planning, branch isolation, demo-safe email operations, visual/accessibility standards, verification, and progress continuity.
- Configured the agent heartbeat at `1h` with light isolated context, a 45-minute turn ceiling, no delivery channel, and `skipWhenBusy` overlap protection.
- Added and enabled a user-level systemd timer for `2026-07-16 13:00:00 UTC` (`14:00 Europe/London`) that verifies the agent ID before changing only its heartbeat to `5m`.
- Repaired the stale OpenClaw gateway service definition from 2026.6.8 to the installed 2026.6.10 service and started it.
- Required every heartbeat to update `PROGRESS.md`, commit and push a truthful checkpoint, then post a bullet-form PR comment identifying Pip and the Bureau, separating current updates from next work, and signing as Pip.
- Rewrote the three existing agent-authored PR comments into the same signed bullet format so the visible history is consistent.
- The agent opened [issue #11](https://github.com/CampaignLab/campaign-factory/issues/11) and [draft PR #12](https://github.com/CampaignLab/campaign-factory/pull/12), then pushed the initial `/operations` implementation and follow-up verification/polish checkpoints through `de3611a`.

### Decisions

- Kept Pip explicitly outside the Campaign Factory LangGraph runtime and Agent Roster. Pip is a build-time coding agent for the separately described OpenClaw Build Reveal.
- Based the feature branch on `factory/multi-agent-build`; the agent may push and update its issue/PR but may not mark ready, merge, deploy, or change production data.
- Limited the working operations slice to labelled browser-local fixture state. Audience selection, drafting, preview, human approval, local demo queueing, reset, and activity are functional; provider connection, delivery, import, analytics, and production scheduling remain explicitly unavailable or coming soon.
- Required a progress-file change with fresh verification or blocker evidence when a heartbeat has no responsible code change, avoiding meaningless empty commits while preserving the requested one-commit-per-heartbeat trail.

### Tradeoffs

- No live email provider, database migration, background job, contact import, or production deployment was added for the demo.
- Native OpenClaw heartbeats are periodic rather than wall-clock exact. The exact cadence transition is therefore handled by systemd, while individual turns may still drift or be skipped when the previous turn is busy.
- The first slice favors a cohesive demonstrable workflow over complete campaign-operations breadth.

### Risks

- A five-minute `gpt-5.5` cadence can consume meaningful model budget. `skipWhenBusy` prevents overlapping runs, but usage should be observed during the demo window and the cadence should be reduced or disabled afterward.
- The cadence-switch timer is installed and validated but cannot be end-to-end proven until its future trigger occurs.
- Heartbeats depend on the gateway service, provider availability, GitHub authentication, and the remote host remaining healthy.
- PR #12 includes shared navigation and existing lint-blocker fixes in addition to the operations route; these changes need normal review before any merge.
- Existing unrelated local changes (`.gitignore` and `web/test-results/`) were preserved and were not included in this setup.

### Verification

- Confirmed the gateway is reachable and admin-capable on loopback with OpenClaw 2026.6.10.
- Confirmed `campaign-ops` reports a `1h` heartbeat and the systemd timer is active for `2026-07-16 13:00:00 UTC`.
- Confirmed remote branch `openclaw/issue-11-campaign-operations` is clean and pushed at `de3611a`; PR #12 remains open and draft against `factory/multi-agent-build`.
- Confirmed the required PR progress-comment format is in use after pushed checkpoints.
- Agent verification reports `npm run lint` passing, a `DATABASE_URL`-backed production build passing, and Playwright checks of the full local operations flow at desktop and 390px widths. A navigation overlap found in the first screenshots was fixed and rechecked.
- Future hourly heartbeats and the scheduled five-minute transition have not yet elapsed, so their runtime history remains to be observed.

### Demo Impact

The Build Reveal now has both visible GitHub work history and a functioning Campaign Operations surface: a campaign brief becomes audience selection, an editable email, explicit human review, and a truthful local-only queue. During the conference window, five-minute checkpoints will make ongoing coding progress visible without overlapping active turns.

### Customer-Facing Context

This setup demonstrates bounded build-time autonomy, not an autonomous campaigning system. The coding agent can change and review a feature branch, while real outreach, production data, approval, merge, and deployment remain outside its authority. The product UI similarly distinguishes local demo state from genuine provider delivery.

### Next Recommended Step

Observe the next scheduled hourly heartbeat for its commit/push/PR-comment sequence, confirm the 14:00 London cadence transition, and review PR #12 plus its Vercel preview before any merge decision. After the conference, return the heartbeat to a low cadence or disable it explicitly.

---

## 2026-07-15T22:05:51Z - Campaign Operations workbench Phase 2

### Goal

Expand Pip's working but simple Campaign Operations page into a complete campaign workbench, and authorize Pip to implement the full scoped expansion without waiting for interim human approval.

### Changes

- Added a Phase 2 task contract covering a route-specific operations header/footer, grouped sidebar, twelve campaign-work destinations, responsive navigation, local state migration, and cross-view workflow verification.
- Granted Pip standing authority to design, implement, refactor, test, document, commit, push, and update issue #11 / draft PR #12 until every Phase 2 criterion was met.
- Built a dedicated Operations shell that replaces global site chrome only on `/operations`; other routes retain the Campaign Factory navigation/footer.
- Added Overview, Campaign brief, Objective & targets, Power map, Strategy & tactics, Evidence & checks, Audiences, Contacts, Drafts, Reviews & approvals, Outbox & schedule, and Responses & results views.
- Added a three-item fixture draft library, substantive Contacts filtering/readiness/consent states, a dedicated review/approval flow, local schedule intent, an honest local-only outbox, and explicit coming-soon provider/import/response boundaries.
- Migrated browser-local state through `cf_operations_demo_v3` with safe fallback from the earlier v1/v2 demo state.
- Expanded Operations Playwright coverage to four tests spanning all twelve destinations and the complete audience → draft → review → explicit human approval → schedule intent → local queue → reload → reset path.
- Rebased onto the moving `factory/multi-agent-build` base, resolved its navigation conflict, reverified the rebased tree, and reconciled the owned feature branch with `--force-with-lease`.

### Decisions

- “Without human approval” applies to scoped implementation work, not external campaign actions. Pip still may not merge, mark the PR ready, deploy, change production data/secrets, connect real providers, import real contacts, or perform outreach.
- Human approval remains a required product-state transition before a communication can enter the local demo outbox.
- Campaign-planning views are operationally useful fixture-backed states; no interface implies that new research, real contact work, delivery, responses, or analytics occurred.
- The workbench uses restrained product density, grouped navigation, rows/split panes, and campaign-first hierarchy rather than generic metric tiles or a decorative monitoring dashboard.

### Tradeoffs

- The expanded demo is browser-local and production-shaped but not production-integrated.
- Supporter email is the fully editable draft; the decision-maker letter and press pitch are honest staged fixtures with outlines/checks rather than falsely complete delivery workflows.
- Phase 2 favors a complete navigable conference workbench in the existing component architecture over introducing a new backend or a larger route/data-model rewrite.

### Risks

- The feature branch was rebased while its base branch was changing quickly. The guarded recovery was verified, but future base changes may require another conflict-aware rebase.
- High-frequency heartbeats after the conference cadence switch can still consume substantial model budget even when only review work remains.
- No live provider, contact import, response collection, production schedule, or database persistence exists; these states must remain visibly disabled.
- The breadth of the single Operations surface may merit later component extraction after the demo.

### Verification

- Final local HEAD, `origin/openclaw/issue-11-campaign-operations`, and PR #12 head all match at `9699112ef44601dcaaab657e7c44a538c982303b`.
- The remote worktree is clean with no rebase/sequencer state; PR #12 remains open, draft, and targeted at `factory/multi-agent-build`.
- `git diff --check`, `npm run lint`, the `DATABASE_URL`-backed production build, and `npm run test:factory -- operations.spec.ts` all pass; Operations tests pass 4/4.
- Browser checks pass at 1440×1000, 1024×768, and 390×844 with no horizontal overflow, accessible active navigation/focus, no double chrome, and a non-operations regression check.
- Safety-copy checks find no claims that communications were sent, delivered, opened, or answered.
- Pip's hourly heartbeat, signed PR updates, gateway service, and the timer switching to five minutes at 14:00 Europe/London remain active.

### Demo Impact

The Build Reveal now demonstrates a complete brief-to-operations story: campaign context becomes targets, evidence checks, audiences, contacts, multiple communications, human review, schedule intent, and a truthful local outbox inside a dedicated workbench.

### Customer-Facing Context

The workbench demonstrates bounded autonomy and explicit side-effect control. Pip autonomously built and verified the feature branch, while the product and build process both keep real political outreach, production integration, merge, and deployment outside the agent's authority.

### Next Recommended Step

Review the Vercel preview and draft PR #12 for demo narrative and visual preference; keep provider/import/response controls disabled, and disable or reduce Pip's heartbeat after the conference window.

## 16 Jul 2026 ~12:25 BST — cap usage reset (conference day)

Organizer decision: zeroed all per-session and per-IP run-cap usage counters
(12 sessions, 9 IPs) ahead of the afternoon session, so morning testing does
not consume the audience's allowance on the venue's shared egress IP. The
caps themselves are unchanged (session and per-IP defaults both 200 for the
event). One-off `update ... set run_count = 0` against the production
sessions/ip_usage tables; no schema change.

## 17 Jul 2026 ~20:50 BST — database migrated to Campaign Lab's Neon project

Post-conference discovery: the app had been running the whole time on a
free-tier Neon project (`neon-claret-kettle`, us-east-1) inside the
sugaroverflow personal Vercel org — created by the Vercel storage
integration — not on Campaign Lab's `CampaignFactoryDB` (eu-west-2). The
free tier's 5 GB/month data-transfer quota was exhausted on conference day
(universal 2.5s polling caused by the SSE localhost-URL bug, since fixed),
hard-blocking all connections until the personal resource was upgraded to
Launch as an emergency measure.

Tonight's migration: full pg_dump (212 MB DB → 76 MB custom-format dump,
neon_auth excluded) restored into `CampaignFactoryDB` with zero errors; all
13 spot-checked table counts match exactly (111,706 factory events, 121
runs, 27 batches). Repointed DATABASE_URL / DATABASE_URL_UNPOOLED /
FACTORY_DATABASE_URL on Vercel (prod + preview), FACTORY_DATABASE_URL on
the Railway worker (direct/unpooled, required for LISTEN), and
web/.env.local. Web redeployed; worker rebooted clean (migrations already
applied, environment identity ok). Cutover proven with a create-and-cancel
probe run that landed in CampaignFactoryDB and left zero rows in the old
project. Pre-migration safety copies on the operator's machine:
`~/campaign-factory-migration/` (source dump + the target's small
pre-overwrite backup, which held 6 dev-test legacy runs never shown on the
live site).

Outstanding: rotate the old project's `neondb_owner` password (credential
was exposed in a session transcript on 16 Jul), disconnect the Neon
integration from the Vercel project, then downgrade/delete
`neon-claret-kettle` once comfortable. Conference-day caps (session/IP 200,
kill-switch $600) still await the post-event posture decision.

## 20 Jul 2026 ~02:15 BST — BYOK: public runs now require the visitor's own Anthropic key

Organizer decision ahead of the newsletter (21 Jul): every public run now
runs on the visitor's own Anthropic API key — the house key never funds a
public run. Rationale: the app is being shared publicly; BYOK moves model
cost to the person running the campaign. Anthropic keys only (not
OpenRouter/OpenAI): the agent pipeline is Anthropic-native — server-side
web search, effort levels, the overload retry ladder, and the Opus
last-resort fallback — so other providers would mean rebuilding the model
layer; deferred as a possible follow-up.

Mechanics: the web gate validates the key with a zero-cost Anthropic
/v1/models call before accepting the run (definite 401/403 → clear
rejection copy; network trouble → 502, never a false reject). The worker
seals the key with AES-256-GCM under FACTORY_BYOK_SECRET before it touches
the database, opens it only when the run executes, and strips it at every
terminal path — no credential outlives its run. A durable meta.byokRun
flag excludes the run's cost from the house daily kill-switch. The
per-campaign $20 hard stop now protects the visitor's key. Presenter
batches and admin-header runs keep the house key (batch-of-1 is the
organizer's solo path). Verified end-to-end on prod: gate rejections
(missing/malformed/invalid key), a real BYOK run (agents researched on the
sealed key; $0.12 recorded, $0.00 counted against the house budget), and
the strip after cancellation.

## 20 Jul 2026 ~18:20 BST — OpenRouter BYOK merged (PR #13) + README refresh

Public runs now accept OpenRouter keys alongside Anthropic. Spike-verified
with a real funded key before merge: Anthropic server-side web_search,
effort, prompt caching, and streaming all pass through OpenRouter's
Anthropic-compatible endpoint. Deploy order worker-first, then merge;
prod-verified end-to-end with a real sk-or- run (3 agents, 3 searches,
zero retries; sealed with provider flag; stripped at cancel). The gate
also now rejects credit-less OpenRouter keys upfront (live-tested against
a zero-balance account). README rewritten to match current functionality
(factory-as-production, BYOK, conference/outage/migration history) and
linked from the site footer as "Source & README".

## 21 Jul 2026 ~21:55 BST — Free-access code: FREE-CAMPAIGN-BUILD waives BYOK; kill-switch off

Typing FREE-CAMPAIGN-BUILD (case-insensitive) into the intake's API-key
field now resolves to a house-key run — the same null-key path admin
callers use — so session/IP caps still apply and the spend lands on the
house ledger. The real code lives only in server env (CF_FREE_CODE,
unset = feature off), compared at call time inside resolveByok; the
client bundle ships only a shape check, never the code itself.
Unrecognised code-shaped input gets its own rejection copy. The legacy
CF_ACCESS_CODE was deliberately not reused — it gates a different route
and circulated at the conference.

Two operational changes alongside it (user decisions, same session):
the daily spend kill-switch is DISABLED — CF_DAILY_BUDGET_GBP=0 on
Vercel prod+preview, and overBudget() now treats a cap of zero or less
as off — leaving the worker's per-campaign COST_GUARDS and the run caps
as the only money backstops. And the worker's ANTHROPIC_API_KEY was
rotated to a Campaign Lab key: the Railway variable edit alone did NOT
restart the container (uptime read ~24h), so the swap needed an explicit
railway redeploy, verified by /health uptimeSec dropping to 23.

Also fixed in passing: tests/factory/public.spec.ts had been silently
broken since the BYOK gate shipped (it never filled the key field, so
the submit button stayed disabled). It now fills the field from
PW_FACTORY_KEY, defaulting to the free code.

## 2026-07-22T16:16:39Z - Repo-local code simplifier skill

### Goal

Adapt Anthropic's code-simplifier workflow for native, shared use in Codex.

### Changes

Added `.agents/skills/code-simplifier` with Codex discovery metadata and a
behavior-preserving cleanup workflow scoped to code changed in the current
task. Its first pass clarified the free-access path by naming mixed key/code
inputs as credentials in local UI and resolver state.

### Decisions

Kept the skill instruction-only. Replaced Claude-specific model and subagent
settings with Codex-native metadata, and made repository guidance and local
code patterns authoritative over generic JavaScript style preferences. The
existing `keyLooksValid` export and `apiKey` request field were deliberately
preserved; only internal naming changed.

### Tradeoffs

The skill does not run automatically after every edit. Codex may match it from
the task description, and collaborators can invoke it explicitly with
`$code-simplifier` when they want a dedicated cleanup pass.

### Risks

Behavior preservation still depends on relevant tests and human-reviewable
diffs; the skill intentionally declines uncertain simplifications. The live
Playwright journey was not run because it requires an already-running web and
worker stack.

### Verification

The Codex skill validator, targeted ESLint, full TypeScript check, direct
credential-path assertions, production Next.js build, and `git diff --check`
all passed.

### Demo Impact

No runtime or demo behavior changed.

### Customer-Facing Context

The checked-in skill makes code-quality workflow expectations repeatable for
Codex users without changing application execution or production controls.

### Next Recommended Step

Run `web/tests/factory/public.spec.ts` against the local mock stack or a safe
preview if end-to-end coverage of the intake flow is needed before release.

## 2026-07-22T16:58:15Z - Depth-first simplification audit

### Goal

Extend the repo-local code simplifier with a reusable file-by-file necessity
audit, then apply it across the maintained application and worker code.

### Changes

The `code-simplifier` skill now defines a guarded depth-first workflow for
runtime roots, support roots, semantic false-positive checks, symbol/section
review, and final keep/simplify/consolidate/delete/quarantine dispositions. A
dependency-audit helper inventories JavaScript/TypeScript/CSS/HTML/SQL files,
resolves relative and TypeScript-alias imports, respects Git ignores, and emits
per-file reachability evidence in dependency-first order.

Added a complete 281-file reachability inventory and a semantic audit overlay
under `docs/`. The overlay identifies fifteen confirmed dead source/assets,
the obsolete gallery-presentation tranche, the temporary worker executor
boundary, and three test-first complexity hotspots.

### Decisions

Reachability is candidate evidence rather than permission to delete. The
worker agent barrel was added as an explicit root after confirming its computed
dynamic import. Ignored local credential files are excluded. The original
`app/` prototype is quarantined rather than refactored because the repository
declares it reference-only and not deployed.

### Tradeoffs

The deterministic helper intentionally does not attempt to prove product
necessity, reflection, public API use, or symbol-level deadness. Those remain a
semantic pass backed by exact-path/export searches and relevant checks. The
audit records recommendations but does not apply application-code deletions or
refactors.

### Risks

The gallery cleanup changes a stale test contract and needs fixture/replay
verification. The worker loader cleanup crosses an ESM boot boundary and must
use direct imports plus container boot validation. Event-fold and graph-node
decomposition require characterization tests because event order, retries,
and deterministic state application are observable behavior.

### Verification

The helper passed Node syntax validation and a real 281-file traversal. The
Codex skill validator passed in a temporary Python environment. Existing
runtime evidence remains clean: worker typecheck, 97 agent checks, document
compiler checks, and store-barrel load passed. Web lint remains red on three
pre-existing React-effect errors and two warnings, all recorded in the audit.

### Demo Impact

No runtime or demo behavior changed. The audit gives a safer sequence for
reducing code before future demo work.

### Customer-Facing Context

The checked-in workflow makes code-removal decisions auditable: it separates
mechanical reachability from semantic necessity and preserves explicit checks
around authentication, persistence, orchestration, and model execution.

### Next Recommended Step

Apply the confirmed dead-file and obsolete-gallery tranche first, then rerun
web lint/build and the gallery fixture/replay checks before touching worker or
event-fold orchestration.

## 2026-07-22T17:08:06Z - Architecture pattern audit and first simplification tranche

### Goal

Re-audit the whole maintained codebase for recurring coding patterns, turn
those patterns into repository-wide standards, and use them to simplify a
safe architectural slice.

### Changes

Added the root `AGENTS.md` pattern catalogue and coding standards, plus a
post-cleanup architecture report in `docs/code-pattern-audit-2026-07-22.md`.
The code-simplifier's guarded DFS was rerun after implementation.

Removed the gallery's obsolete compact/pill/judgement presentation system end
to end: implementations, types, priority fields, adapter paths, no-op props,
limits, exports, CSS, receipt variants, comments, and the stale ten-expanded-
card test contract. Removed dead shared UI components, an unused state barrel,
and default unreferenced Next assets. Public gallery/card barrels now expose
only active consumers.

Added a hydration-safe `useStoredString` platform adapter and used an
external-value-plus-edit-override pattern for the admin key and campaign
access code. Removed the ignored `documentPill` flag parameter and a dead
verification-script variable.

### Decisions

Treated product decisions as architectural boundaries: once all gallery cards
became always open and judgements moved to the brief, compatibility types and
no-op props no longer represented a real contract. Kept event folds, graph
nodes, the worker executor boundary, persistence, and live transport intact;
those need characterization/boot coverage before structural changes.

Retained the apparently empty `web/next.config.ts`: a deletion build exposed
that Next would otherwise discover `../../next.config.ts` and inherit another
application's Server Action body limit and response-header behavior. It is a
workspace-isolation boundary rather than dead configuration.

The code-simplifier workflow shaped the change order: mechanical reachability
identified candidates, semantic caller/export/CSS/test searches established
necessity, and only the low-risk complete concept was removed.

### Tradeoffs

The browser-storage hook adds one small module, but removes duplicated
hydration effects and establishes a reusable platform boundary. The full
worker/runtime architecture opportunity remains deferred rather than mixing a
high-risk ESM and orchestration rewrite into a UI cleanup.

### Risks

The gallery E2E assertions now encode the approved always-open layout and
should be exercised against a running local mock stack before a release that
depends on presenter choreography. Deleted files are Git-tracked and
recoverable.

### Verification

Post-cleanup DFS scanned 271 files: 250 runtime-reachable, 16 support-only,
five standalone migrations, zero unreachable candidates, and seven expected
ignored-environment edges. Web ESLint and the Next.js production build passed.
Worker TypeScript passed. The full document compiler/render executable check
passed. Deleted-symbol/reference searches and `git diff --check` passed.
Playwright was not run because no local web/worker stack was active. The build
retained the existing multiple-lockfile workspace-root warning.

### Demo Impact

The gallery keeps the same approved always-open behavior with less dormant
code and a test contract that now matches the UI. Intake/admin stored values
still restore after hydration without effect-driven state copying.

### Customer-Facing Context

No intended public behavior changed. This reduces dead architecture and makes
future work follow one documented set of contracts, state, rendering, store,
and runtime-boundary standards.

### Next Recommended Step

Run the factory Playwright suite with the local web and mock-worker stack. Then
add characterization tests before simplifying the event fold, worker graph,
or live transport controller.

## 2026-07-22T17:54:39Z - Functional confirmation and repository retirement cleanup

### Goal

Confirm that the simplification refactor did not break the app, exercise a
real provider path with the local API key, remove remaining repository clutter,
and replace the README material with a concise and accurate project guide.

### Changes

Strengthened the public Playwright smoke test so its static "Starting up"
placeholder no longer counts as liveness. It now waits for a folded
`agent.started` state and cancels every accepted run with the run-scoped stream
token, including when an assertion fails. Updated stale presenter, gallery,
and fixture selectors to the current auto-session and always-open-card UI.

Removed the tracked reference-only `app/` prototype and 33-file HTML archive as
one retired product tranche. They had no maintained runtime, deployment, or
fallback caller; `/legacy` in Next.js remains the supported comparison path.
Adjusted the OpenRouter probe to read the current environment boundary instead
of the retired prototype. Git history retains every removed file.

Replaced the root README with a human-readable architecture, component map,
local setup, verification commands, routes, and security model. Reduced the
stale `web/README.md` from 243 to 91 lines and corrected outdated worker limits.
Updated the audit documents and coding standards to reflect prototype
retirement and the final maintained inventory.

### Decisions

Preserved research decks, product/architecture records, local ignored
credentials, and the ignored Campaign Ops staging workspace: they are source
material or separate user work rather than build residue. Removed only tracked
obsolete products and reproducible test/build output.

Kept the higher-risk event fold, worker graph, persistence, retry, and live
transport refactors deferred. Their current behavior is now verified, but
structural simplification still needs dedicated characterization coverage.

### Tradeoffs

The historical plan and journal still name retired paths because they describe
the build at that time; the plan now carries a note that those files live in
Git history. Local credential files under `app/` were not deleted because
repository cleanup is not authority to destroy a user's secrets.

The shared development database also shares one `pg-boss` queue. Another
connected worker claimed some mock-suite jobs, so the five-campaign batch
reached four terminal campaigns rather than five locally. Deterministic gallery
fixtures and the public mock flow passed, but future full-batch regression runs
should use an isolated database.

### Risks

Any worker connected to the same database can consume that environment's jobs,
regardless of which machine started them. During this verification one earlier
test job was claimed by a live worker and completed for about $0.90. All other
unfinished test runs were cancelled. The README and Playwright documentation
now call out database isolation for deterministic, zero-cost testing.

The Next.js build still reports the pre-existing multiple-lockfile workspace-
root warning. It does not affect compilation or route generation.

### Verification

- Live web and worker readiness checks passed with database, signing, model,
  factory schema, checkpoint schema, and queue schema all ready.
- A browser run using the local Anthropic key was stored as an encrypted BYOK
  run and emitted real `agent.started`, `cost.update`, evidence-search, fetch,
  specialist, and work events before cancellation.
- The strengthened public Playwright flow passed in mock mode in 7.7 seconds
  and cleaned up its own run.
- The gallery fixture rendered 23 full-width agent cards with a completion
  receipt and zero browser console warnings; stored admin state survived reload.
- Web ESLint and the full Next.js 16 production build passed all 23 generated
  pages/routes; worker TypeScript passed.
- The complete document compiler/render executable check passed.
- Final dependency traversal: 235 runtime files, 16 support files, five
  migrations, zero unreachable candidates, and five intentional ignored-env
  edges.

### Demo Impact

The maintained app, presenter/gallery layout, live assembly, documents, and
storage behavior are unchanged. Tests now fail on a static startup shell and
avoid leaving paid work running.

### Customer-Facing Context

The repository now presents the current product first, with one concise setup
path and no duplicate prototype implementations. BYOK handling was verified
through the real boundary without exposing a credential.

### Next Recommended Step

Use a dedicated local or preview database before rerunning the complete
five-campaign Playwright batch. Add characterization tests before simplifying
the event fold, graph orchestration, or live transport controller.

## 2026-07-22T18:26:22Z - Full live campaign completion gate

### Goal

Do not merge the simplification refactor until one real, full-profile campaign
has generated completely using the local API credential and its terminal
outputs have been checked through persistence, API, and browser surfaces.

### Changes

No application code, commit, or merge was made. Started the local web and
worker in live mode, then submitted one full-profile BYOK Anthropic campaign
for a Leicester school-street case. Followed it from queue creation through all
research, evidence, analysis, strategy, production, review, and finalisation
waves. Recorded campaign ID `b9beddaa-2c56-48f0-8ba2-b737740d9d42`.

### Decisions

Used the worker's `full` profile rather than the public `express` profile so
the verification exercised both selected specialists, the complete agent
graph, all review gates, and all material producers. Passed the local API key
through the BYOK seam rather than relying on a remote worker's house key.

Defined success as terminal `completed`, all 15 agent rows complete, all nine
campaign sections accepted, all nine durable documents ready, a completion
receipt, a successful documents API response, and a completed browser render.
An active/startup screen was not accepted as completion evidence.

### Tradeoffs

The run was launched directly through the signed local worker API to select
the full profile; the public intake intentionally selects express. The browser
observed the same public assembly route and polling/event fold used by ordinary
shared links. Four bounded judgement requests used their documented defaults
because no interactive starter session was attached to the direct request.

### Risks

The campaign is complete but honestly retains three Terminal Gaps and 30
unresolved load-bearing claims for human checking. Those are research
uncertainties, not missing campaign sections or documents. Generated campaign
material still requires human review before use.

The development database queue is shared with other workers. BYOK metadata and
terminal credential cleanup were checked explicitly so completion evidence did
not depend on which compatible worker process claimed the durable job.

### Verification

- Run status: `completed`, full profile, no error; elapsed 24m 49s.
- BYOK: Anthropic provider, encrypted seal present while running and absent
  after terminal finalisation.
- Agents: 15 spawned, 15 complete, zero partial or failed.
- Campaign: 9/9 accepted sections; accepted state version 58.
- Documents: 9/9 ready. The terminal documents endpoint returned HTTP 200 and
  all nine canonical keys at `ready`.
- Packs: lobbying, media, and digital packs each contain 11 resources.
- Research ledger: 132 claims, including 67 verified-public-information
  claims; 21 source fetches recorded in the receipt.
- Audit/event log: 1,880 ordered Factory Events plus one campaign receipt and
  one `run.completed` event.
- Model ledger: 47 entries, 47,962 input tokens, 213,756 output tokens, total
  cost $3.9346023.
- Browser: generated title, `Complete · 9 of 9 sections built`, all nine
  document cards with copy/download controls, 10 labelled sources, and zero
  console errors or warnings.

### Demo Impact

The refactored application has now completed a real end-to-end full campaign,
not just mock, fixture, build, or liveness checks. The completed campaign is
available locally at `/factory/c/b9beddaa-2c56-48f0-8ba2-b737740d9d42`.

### Customer-Facing Context

The run demonstrates the production trust model: provider credentials remain
sealed during work and are removed on completion; append-only events expose
agent progress; evidence uncertainty remains explicit; and deterministic
finalisation produces versioned documents and a measurable receipt.

### Next Recommended Step

Review the existing working-tree diff and this completion evidence. Only merge
after the user explicitly authorises it; this run is evidence, not merge
permission.

## 4 Aug 2026 — BYOK rolled back to optional; kill-switch re-armed at ~$100/day

The 20 Jul BYOK-required policy is reversed (user decision): a blank
API-key field is now a house-key run on the Campaign Lab key. Supplying
a key still works exactly as before — validated, sealed, run on the
visitor's account — and because BYOK runs bypass the house budget, "add
your own key" is now the overflow path once the shared budget is spent
(the 503 capacity copy says so). The free-access code remains accepted
but is redundant: blank does the same thing. resolveByok loses its
isAdmin parameter (nothing distinguishes admin at the key-resolution
step any more) and the byokRequired error field (no consumers).

The daily kill-switch, disabled since 21 Jul, is re-armed:
CF_DAILY_BUDGET_GBP=78.74 on Vercel prod+preview ≈ $100.00/day at the
configured 1.27 FX. Per-campaign COST_GUARDS and session/IP caps
unchanged. Also noted: web/.env.local no longer exists locally, so
`next build` fails at page-data collection on this machine (no
DATABASE_URL) — compile/tsc/lint/gate-smoke all pass; the deploy build
runs on Vercel with real env.

## 8 Sep 2026 — Key field removed from the intake; every run on the house key; budget $200/day

BYOK was confusing users (user report), so the API-key field is gone
from /factory entirely. In its place a short note: building is free on
Campaign Lab's shared daily budget; at capacity, come back tomorrow.
Every UI run is now a house-key run. The server gate still accepts an
optional apiKey (validated, sealed, visitor-billed) for anyone calling
the API directly — the BYOK machinery keeps working, it just has no UI.
The budget-exhausted 503 copy no longer suggests adding a key.

Daily kill-switch raised to CF_DAILY_BUDGET_GBP=157.48 ≈ $200/day on
Vercel prod+preview (was £78.74 ≈ $100). Per-campaign COST_GUARDS and
session/IP caps unchanged. public.spec.ts no longer fills the removed
field. Reminder recorded: the key that funds runs is ANTHROPIC_API_KEY
on the Railway *worker* service (not Vercel's, which only feeds the
dormant legacy route), and Railway variable edits need an explicit
`railway redeploy --service worker`.
