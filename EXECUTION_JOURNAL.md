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

## 2026-07-14T16:25:01Z - Mission Bay conference prototype

### Goal

Implement the approved Mission Bay defaults in an isolated worktree and prepare a
reviewable pull request. Preserve the long campaign journey, make an agent factory
legible to campaigners, and prove one coordinated mission without fabricating the
other catalogue capabilities.

### Changes

- Added `/c/[id]/missions` as a second act for one Hyperlocal Campaign and added an
  end-of-journey transition into it.
- Added the twelve-mission catalogue organised by Challenge, Investigate, Watch and
  Prepare. Only Viability Tribunal is operational; the other eleven use explicit
  `Up next` or `Future mission concept` labels and never animate as active work.
- Implemented Viability Tribunal as four parallel Sonnet 5 examinations followed by
  a Sonnet 5 Tribunal Chair. All calls use structured outputs. Invalid evidence IDs
  are removed, and an `evidence` claim with no valid source ID is downgraded to
  `unknown`.
- Added immutable campaign snapshots, SHA-256 snapshot hashes, mission runs, mission
  events, worker reports, verdicts, cost, failure state and human review state to
  Postgres.
- Added owner-only mission launch and review endpoints, read-only result access for
  people who can view the private-by-default campaign URL, one-active-run protection,
  daily budget enforcement and readonly-mode enforcement.
- Added visible event history, examiner reports, preserved disagreement, evidence
  links, local-knowledge questions and an explicit human approval gate. The mission
  never edits the campaign.
- Extended `/how` to explain that Mission Bay is a Factory Visualisation of bounded
  server processes, not a literal digital workforce.
- Added the Mission Bay concept, implementation plan, product register and domain
  glossary to the branch.

### Decisions

- The conference prototype proves one mission deeply instead of simulating a busy
  operations console.
- The tribunal audits the existing campaign and evidence register without web search.
  Re-research belongs in a future Evidence Audit or Decision-Route mission.
- Examiner failures are retained in the event history. The chair may adjudicate only
  when at least two independent examinations complete; otherwise the run fails rather
  than manufacturing a verdict.
- `complete` means all four examiners and the chair completed. A chair verdict based on
  two or three reports is explicitly `partial`.
- Review decisions are audit notes only: reviewed, rejected or needs local knowledge.

### Tradeoffs

- Runtime execution uses the application's existing `after()` pattern and 800-second
  ceiling. Durable workflow infrastructure was not introduced in this PR.
- The Tribunal Chair uses Sonnet 5 at high effort instead of Opus to keep the
  conference latency and cost plausible. The four examiners use Sonnet 5 at medium
  effort and run concurrently.
- Watcher missions remain non-functional until scheduling, stop controls, durable
  execution and source-specific monitoring are implemented.
- The prototype does not apply recommended changes because campaigns do not yet have
  versioned editing or approval-aware mutation.

### Risks

- No paid live tribunal was launched during this implementation. Latency, cost and
  output quality still require the five-run deployed benchmark in the implementation
  plan.
- A server interruption can leave a run recorded as `running`; durable execution and
  stale-run recovery remain required before enabling persistent missions.
- The full repository lint command still fails on three pre-existing React 19
  `set-state-in-effect` errors in `admin/page.tsx`, `CampaignApp.tsx` and `Reveal.tsx`.
- `npm install` reports two moderate dependency vulnerabilities. No forced dependency
  upgrades were attempted in this feature branch.
- Loading Mission Bay against the configured development database exercised the
  idempotent migration and created the empty mission tables and indexes. It did not
  create a mission run or spend model tokens.

### Verification

- Targeted ESLint passed for all Mission Bay code and every touched application file.
- `npm run build` passed with Next.js 16.2.10 after loading the existing local
  environment and allowing `next/font` to fetch its existing Google fonts.
- Browser-checked the campaign transition, Mission Bay desktop reveal, 390px mobile
  layout, catalogue semantics and `/how#mission-bay` in Chromium. No browser console
  errors were reported.
- Verified the public mission-list endpoint returns an empty run list and
  `canLaunch: false` for a viewer. Verified an unauthenticated launch attempt returns
  HTTP 403 without creating a run.
- Verified exactly twelve catalogue definitions and four purpose groups in source.

### Demo Impact

The campaign remains the main story. The final transition now opens a second act where
the audience can see one campaign split into four independent examinations, recombined
by a chair and stopped at human review. The eleven static mission rows make the future
factory visible without claiming that unavailable capabilities ran.

### Customer-Facing Context

Mission Bay is bounded autonomy: public or campaign-supplied evidence, immutable input
snapshots, source-restricted claims, persisted audit events, no autonomous contact or
publication, and explicit human judgement. The interface visualises orchestration but
does not claim that agents are people or that future mission concepts are live.

### Next Recommended Step

Run five real Viability Tribunals on representative completed campaigns in the deployed
environment. Record latency, per-agent failure, cost, citation validity and verdict
usefulness. If any run exceeds 120 seconds or the current function lifetime is
unreliable, move mission orchestration to a durable workflow before the conference.

## 2026-07-14T18:36:03Z - Mission Bay visual and multi-mission refactor

### Goal

Turn Mission Bay into a continuation of the campaign journey, make the first four
prioritised missions genuinely runnable, keep every result and decision inline, and
strengthen the runtime so only one mission can be active for a campaign.

### Changes

- Rebased `codex/mission-bay` in an isolated worktree, then refreshed it onto the
  latest local `main` at `1d6af21`, preserving unrelated changes in the primary checkout.
- Replaced the dark factory panel and Mission Bay-specific colour variables with the
  existing journey hero, sticky rungs, pills, pastel callouts, diagrams and stage gates.
- Added a keyboard-operable four-tab selector. It updates an abstract Lucide-icon flow
  from immutable campaign snapshot through specialists, reconciler, output and human
  decision. Selection does not launch paid work.
- Added four complete mission rungs for Viability Tribunal, Whole-Campaign Evidence
  Audit, Decision Route & Meetings Audit, and Campaign Precedent Review. Each shows its
  question, team, tools, artefact, decision, safety boundary, launch state, live agent
  states, events, typed output, human review and previous runs inline.
- Added query-linked history at
  `/c/[id]/missions?mission=<slug>&run=<uuid>`. Invalid, mismatched and unrelated runs
  are ignored at the page boundary.
- Replaced the hard-coded viability runtime with a server-only registry. Each executable
  specification owns readiness rules, agents, worker schema, synthesis schema, worker
  threshold, prompts, preparation and result normalisation.
- Added a shared orchestration engine and the generic
  `POST /api/campaigns/[id]/missions/[missionSlug]` launch route. Ownership, readonly,
  daily budget, readiness and global active-run checks occur before launch.
- Generalised Postgres mapping and JSONB result validation across four discriminated
  mission results. The partial unique index now covers `campaign_id` alone for queued
  and running rows. Read-time adapters keep legacy Viability results and reports usable.
- Made Evidence Audit inventory deterministic. Every source claim and unresolved lint
  item is retained, no more than 24 priority items are marked for recheck, and remaining
  items are explicitly `not_rechecked` with original labels and evidence preserved.
- Added supported UK Parliament committee and meeting adapters, official-domain
  ModernGov detection, ModernGov committee and meeting calls, provider coverage ledgers,
  12-month and 90-day windows, official-source restrictions and incomplete-coverage
  labels for Decision Route Audit.
- Added URL validation, citation normalisation and deterministic evidence downgrades.
  Unsupported evidence becomes `unknown`; formal-route evidence needs a primary official
  URL; precedent causal claims remain inference at the validation boundary.
- Removed both inline Mission Bay explainer links. The global footer still links to
  `/how`.

### Decisions

- Public catalogue metadata remains client-safe and separate from executable server
  functions. Browser code cannot select arbitrary prompts, schemas or runtime work.
- Mission inputs are immutable campaign snapshots. Provider records and model reports
  are evidence for a persisted result, not permission to mutate the campaign.
- One active mission is enforced twice: a campaign-wide lookup provides a useful UI/API
  response, and a partial Postgres unique index resolves cross-instance races.
- Provider coverage is intentionally conservative. A responding API is labelled partial
  until relevance and missing records are reconciled; an absent record is never treated
  as proof that no meeting, route or deadline exists.
- Existing Viability rows are adapted only when read. New writes must pass the current
  discriminated schema, so compatibility does not weaken the runtime contract.

### Tradeoffs

- The runtime continues to use Next.js `after()` with the existing 800-second ceiling.
  Durable job scheduling, retries, stale-run recovery and stop controls remain outside
  this change.
- Official provider calls are bounded preflight context for the decision-route agents.
  They do not attempt to normalise every Parliament or council product into one universal
  civic-data model.
- Precedent causality is conservatively held at inference. A future direct-evidence field
  and deterministic source inspection would be required to promote it.
- Browser acceptance used an existing shared campaign in viewer mode. No paid mission was
  launched and no temporary campaign or mission row was created.

### Risks

- Live latency, token cost, model/tool compatibility and output quality have not yet been
  measured for the three new web-research missions.
- A server interruption can still leave a mission active until operational recovery.
  This matters more now that the unique index blocks every other campaign mission.
- Parliament and ModernGov response shapes vary. Fixture tests cover supported shapes,
  but live council services can omit endpoints, return escaped datasets or reject date
  formats. These cases stay visible as unavailable or partial coverage.
- `npm install` continues to report two moderate dependency vulnerabilities. No forced
  dependency upgrade was applied.

### Verification

- Vitest: 4 files and 11 tests passed. Coverage includes registry integrity, strict
  synthesis failure, full/partial/below-threshold worker outcomes, deterministic evidence
  inventory, invalid URL rejection, evidence downgrade, real `mission_type` row mapping,
  legacy Viability row mapping, campaign-wide active status and fixture-backed Parliament
  JSON plus ModernGov XML parsing.
- Strict TypeScript passed with `npm run typecheck`.
- Targeted ESLint passed for all changed mission, database, API, page and transition code.
- Next.js 16.2.10 production build passed and generated the generic mission route plus the
  dynamic Mission Bay page.
- Chromium verified desktop, 1920 by 1080 projector and 390 by 844 mobile layouts. The
  document width stayed at 390px on mobile. Mouse and arrow-key tab selection, focus from
  `Open this mission`, viewer launch messaging, selector content, invalid query fallback,
  reduced-motion duration, the single campaign transition link and footer-only `/how`
  link all behaved as intended. Browser console reported zero errors and zero warnings.
- Loading the page exercised the idempotent database migration against the configured
  development database and created the campaign-wide partial unique index. It created no
  mission run and spent no model tokens.

### Demo Impact

Mission Bay is now visibly the campaign's next rung, not a separate AI console. A
presenter can select any live mission, explain the specialist team and evidence boundary,
open the matching rung, and show where events, results, human judgement and history live
without leaving the campaign narrative.

### Customer-Facing Context

The runtime demonstrates bounded autonomy with server-whitelisted work, immutable inputs,
typed outputs, provider coverage, deterministic citation downgrades, persisted events,
race-safe concurrency and review-only human decisions. No mission sends messages,
publishes, profiles people, edits campaign data or converts inference into official fact.

### Next Recommended Step

Run two deployed examples of each runnable mission before the conference. Record complete
event history, provider coverage, valid URLs, political-position safety, partial-failure
coherence, latency and cost. Then add stale-run recovery before enabling any persistent
watcher.
