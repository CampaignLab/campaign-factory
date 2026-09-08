# Vercel Workflow migration — one deploy story

**Decision (user, 8 Sep 2026):** move campaign-run execution off the Railway
worker and onto Vercel Workflow, so the whole system has one platform, one
deploy, and one place for env vars ("one deploy story and ownership").

## Why now

- Every recent operational incident was Railway-shaped: manual `railway up`,
  variable edits that don't restart the container, stale containers, the
  wrong-linked-service trap (umami became the CLI default), and a dead
  `ANTHROPIC_API_KEY` that hid for two weeks because nothing redeploys there
  automatically.
- Vercel Workflow now covers what the worker hand-rolls: durable steps with
  retry and persisted results (today: pg-boss + LangGraph PostgresSaver),
  replayable namespaced streams (today: bespoke event log + SSE + stream
  tokens + polling), hooks for human-in-the-loop, run observability
  (`npx workflow web`, Vercel dashboard), crash-safe orchestration.
- Runs spend most of their 15–25 min waiting on model responses; Fluid's
  active-CPU pricing should make this cheap. Railway's flat fee goes away.

## Spike result (8 Sep 2026 — PASSED)

`web/src/workflows/spike.ts` + `POST /api/workflow-spike` (gated by
`WORKFLOW_SPIKE_SECRET`, unset in prod → dead route). One `"use step"`
function reused `lib/anthropic getClient()/call()` unchanged: claude-sonnet-5,
`web_search_20260209` (incl. code-execution containers + pause_turn resumes),
live tool notes and text deltas streamed via `getWritable()`, correct sourced
answer. Run `wrun_01M20JSZDNMKP27WNB9V0N0Q2K` on preview: step 111s,
8 search/tool notes, 22 stream chunks. Zero backend setup — the Vercel World
auto-provisioned on deploy, isolated per environment.

## Mapping (worker → Workflow)

| Worker today | Workflow |
| --- | --- |
| LangGraph graph + PostgresSaver | `"use workflow"` orchestrator; step results are the checkpoints |
| pg-boss queue, retries, dead-letter | built-in step retry; `RetryableError` / `FatalError` (map the model-error taxonomy: 529→Retryable w/ backoff, 401/402→Fatal) |
| Agent runtime (agents/deps) | one `"use step"` per agent call, reusing `lib/anthropic` as-is |
| Event log + SSE + stream tokens + polling | namespaced streams; `run.getReadable({ startIndex })` is replay/resume; keep writing the SAME event rows to Postgres from steps so the existing UI + gallery + brief compile stay untouched |
| Reviewer / judgement (C1) | `createHook()` / `resumeHook()` |
| In-process concurrency gate (global model-call caps) | per-run caps stay trivial (one orchestrator per run); the GLOBAL cap needs a shared store (Postgres advisory counters) — design before cutover |
| COST_GUARDS + cost ledger | unchanged: steps write factory.cost_ledger; per-run guard state lives in the workflow |
| Railway env (`ANTHROPIC_API_KEY`, `FACTORY_BYOK_SECRET`, …) | Vercel env — one place |

## Phases

1. **Spike** — done (above).
2. **Skeleton — DONE (8 Sep 2026, PR: feat/workflow-migration-phase2).** The
   whole campaign graph runs as `src/workflows/campaign.ts`: one "use step" per
   worker graph node (same crash/retry unit as checkpoint-per-node), state as
   plain locals with the exact channel-reducer semantics, agent brains copied
   1:1 into `web/src/lib/factory/exec/` (see its README for provenance +
   accepted deltas). Start route: `POST /api/factory/workflow-runs`
   (WORKFLOW_SPIKE_SECRET-gated; house-key only; returns empty streamToken →
   client falls back to polling). Mock-mode E2E on preview PASSED: campaign
   3fcd39db — completed, 9/9 sections accepted, 9/9 documents ready, receipt
   before terminal, terminal event last, zero gaps, 193 events; the standard
   read model, campaign page (compiled title), and documents recompile
   endpoint all rendered it. STILL PENDING from phase 2: a LIVE express run on
   the workflow path + per-step `maxDuration` for full-effort research calls
   (express spike call was 111s; the 300s default may clip full-profile
   research).
3. **Parity**: retries/backoff taxonomy, cancellation, cost guards, global
   concurrency gate, BYOK sealing (or drop worker-side sealing — key is
   API-only now), dead-letter equivalent (workflow failed-run alerting).
4. **Cutover**: public solo runs first (flag flip in the intake route), soak,
   then presenter batches. Worker stays warm as instant rollback.
5. **Sunset**: retire the Railway worker service (umami stays on Railway or
   moves separately); delete worker/ deploy docs; env story becomes
   Vercel-only.

## Open questions (resolve in phase 2)

- Per-step max duration on the campaign-lab plan vs. the longest single model
  call (express profile is fine at ~2 min; full profile research is not).
- Usage accounting across pause_turn segments: the spike's final-message usage
  under-reports (input 8 tokens); keep summing via the existing onUsage sink.
- Live view transport: keep polling the DB (zero UI change) vs. adopt
  `getReadable` streams in the client (better, more change).
- `supportsCancellation` on any route that pipes `run.getReadable()` to a
  browser, so abandoned tabs don't bill to max duration.
