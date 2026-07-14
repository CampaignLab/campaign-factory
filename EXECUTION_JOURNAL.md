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
