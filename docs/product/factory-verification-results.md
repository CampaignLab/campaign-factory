# Factory rewrite — verification results

**Status:** Living record of the 12-hour build's verification phase, 15 July 2026. Companion to [`factory-12-hour-build-plan.md`](factory-12-hour-build-plan.md).

## Reduced mock evaluation (integration agent, dev DB, `FACTORY_MODEL_MODE=mock`)

| # | Item | Result |
|---|---|---|
| 1 | Whole-tree production build | PASS — exit 0, 17 pages, all factory routes |
| 2 | Public flow E2E | PASS — 174 events, strictly monotonic, SSE=poll parity, 9 documents served, SSR 200 |
| 3 | Run terminal status | Honest partial by design: mock pack fixtures carry verification placeholders, so packs are correctly `needs verification` and mock can never reach `completed` without weakening honesty. Receipt-tally bug found and fixed (tally now derived from the authoritative compiler) |
| 4 | Cancellation | PASS — terminal `run.cancelled` last, accepted sections readable; ≤1 in-flight node may finish (node-boundary race, characterized) |
| 5 | Crash recovery (SIGKILL) | FAIL then **PASS after fix** — pg-boss lease left runs stuck ~30 min; on-boot orphan-recovery scan added (plus two real bugs fixed: singleton dedupe was unenforced under the `standard` policy; queued-job cancel was dead code). Re-test: resume 227 ms after boot, sequence contiguous 1→180, zero duplicate documents/agents, single terminal + receipt |
| 6 | Presenter batch (3 campaigns) | PASS — concurrent fan-out within 430 ms, 23 cross-campaign interleavings, batch receipt persisted, gallery cookie gate correct |
| 7 | Replay promotion | PASS (mechanism) — immutable manifest, permanent label, renders 3 campaigns from stored events with zero worker references |
| 8 | Latency/metrics | PASS — mock milestones: first sourced ~2 s, first accepted ~17 s, usable ~67–81 s; admin costs page degrades cleanly with no key |
| 9 | Typechecks | PASS — web and worker `tsc` exit 0 |

Playwright: presenter-batch spec **passed twice** against local mock (~3 min/run): code gate, five campaigns + sixth rejected, 5 anchors/hues, expanded-card cap peaked at exactly 10, receipts → brief in new tab (11 sections + 9 doc cards), no `undefined`/`NaN` tells, all agent names from the roster. Public spec skips honestly on the local IP cap; runs on preview.

## Live run #1 (Leicester school street, public, local worker)

**Outcome: honest partial, 24.9 min, $1.97** (guards: $4 warn / $8 hard — never approached). 382 events, 15 agents, 2 sections accepted, 58 claims (45 load-bearing, 22 verified), 1 nonblocking Judgement Request correctly defaulted, 9 document statuses (1 ready), receipt emitted.

**Live-only defect found (the reason item 10 ran before batch tests):** every tool-using agent (research director, both specialists, evidence adjudicator, decision route) failed with a sanitized provider error after its visible retry, at 21–123 s — too fast for wall timeouts. `fetch_page` completed 20/20; searches started 48 / completed 19. Working hypothesis: the multi-turn continuation breaks when one turn mixes web-search server-tool blocks with client `fetch_page` tool_use. Under diagnosis by the agent-contracts workstream with an env-gated error tap. The degradation path behaved as designed throughout (visible retries/failures, reviewer returns, honest statuses).

**Discrepancies logged:**
- Five `agent.failed` events produced zero `gap.terminal` events — ADR 0011 expects failed responsibilities to surface as Terminal Gaps (state-level next-checks may cover this; needs confirmation).
- Run duration 24.9 min vs the 20-min hard execution limit — verify the limit stops new model nodes at 20 min as specified.

## Pending (appended as they complete)

- Live run #2 after the tool-loop fix (clean gate measurement).
- Railway worker deployment + Vercel preview wiring.
- ≥2 live five-campaign Playwright batch tests against the Vercel preview (user-authorized; $35/batch hard stop) with JSON summaries in `web/test-results/`.
