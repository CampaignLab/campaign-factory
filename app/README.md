# Campaign Factory — live proof of concept

Enter a UK local or public-policy campaign problem — including one suggested live by an
audience — and Campaign Factory **researches it live**, verifies what it can, applies the
campaign-planning framework, and presents the campaign as one scrollable journey:

**problem → research → objective → decision-maker → power → pressure → strategy → tactics →
organising → drafted resources → document library → sources → how this was built**

## Running it — recommended setup (live mode)

```
# 1. put the key in app/.env:   ANTHROPIC_API_KEY=sk-ant-...
# 2. start the proxy (serves the app AND relays API calls; key stays server-side):
node app/proxy.js
# 3. open the app at:
http://localhost:8787
```

Why the proxy: the page and the API then share one origin, so no browser policy can interfere —
important because **many organisations disable browser (CORS) API access in their Console
settings** ("CORS requests are not allowed for this Organization"), and Chrome's private-network
rules can block `file://` pages from reaching localhost. The proxy sidesteps all of it and keeps
the key out of the browser entirely.

Generation uses `claude-opus-4-8`: three streamed calls — research with the web-search server
tool (citations + verification labels), campaign plan, drafted resources — merged into one shared
campaign state, plus a keyless postcodes.io geography lookup. Streaming + a 90s inactivity
watchdog make the calls resilient to flaky networks.

**Timing (validated live):** research ~2 min · plan ~2–3 min · drafts ~2–3 min — a full run lands
in roughly 6–8 minutes. Research is deliberately constrained to 4 prioritised searches so it
converges on stage; whatever it didn't reach is listed under unresolved questions instead of
being chased indefinitely. **Do not refresh the page mid-run** — browsers abort in-flight
requests on refresh.

Alternatives (only if your org allows browser API access): open `app/index.html` directly and
either paste a key in **⚙ Setup** (localStorage) or create `app/local-key.js` containing
`window.CF_LOCAL_KEY = "sk-ant-...";`. If a direct call is CORS-blocked while the proxy is
running, the app switches to the proxy automatically.

- **Simulated mode** (no key, or key cleared): the offline fallback. Same journey, same nine
  documents, generated from the scenario engine — everything labelled as requiring verification.
  This is the emergency backup path; it cannot fail.

## Input

One conversational field plus optional structured fields (organisation, location, desired
outcome, known decision-maker, timeframe, people affected, evidence, resources). Suggested
template shown in the placeholder; a beginner variant appears under the field. Imperfect
prompts are expected — research fills gaps and reports what it could not establish.

The **prepared example** button toggles between the Lime-bikes/Olympic-Park example (good live
demo) and the library-closure example (emergency backup).

## Reliability & fallback (live mode)

- Research results appear as they arrive; a failed source never blocks the run.
- If a stage fails (network, rate limit, refusal), a presenter-visible banner offers
  **Retry this stage** or **Continue without it** — completed stages are preserved and the
  missing stage falls back to labelled simulated output.
- Nothing invented is presented as verified: every claim carries one of the verification labels
  (`Verified public information`, `Supported inference`, `Generated campaign recommendation`,
  `Campaign assumption`, `Conflicting evidence`, `Verification incomplete`,
  `External information unavailable`), and generated drafts mark unresolved facts as
  `[VERIFY: …]`. The system never invents quotes, officeholder names, contact details, meeting
  dates, or journalist names.

## Campaign library

Every generated campaign (live or simulated) is saved automatically and listed under
**Library** in the menu bar — open one to return to its full journey and documents
(including your edits), or delete it. Storage is the browser's localStorage on the current
origin, so on the demo machine (`http://localhost:8787`) campaigns persist across sessions;
the newest 20 are kept. The instant `?auto&skip` fallback tab is not saved (it would add a
duplicate on every page load).

## Demo modes / URL flags

- `?auto` — start the backup example immediately · `?auto&lime` — the Lime example
- `?fast` — short simulated sequence (rehearsal)
- `?auto&skip` — straight to a finished simulated journey (instant fallback tab)
- `?lib` — open the campaign library directly
- `.` during simulated processing — fast-forward

## What is real, generated, mocked, placeholder

| Kind | Where |
|---|---|
| Real, live | web-research claims with sources/URLs/dates; postcodes.io geography; the Sources section |
| Real, preloaded | UK local-authority register; local media outlet names (`app/data/`) |
| Generated | objective, plan, tactics, organising, drafts — labelled; consistency-checked (qualityFlags) |
| Mock / placeholder | maps, photos, journalist contacts — polished, labelled components |
| Future integrations | `js/adapters.js` documents the seam per source (councils, Parliament, consultations, ONS…) |

## Architecture

`js/engine.js` builds the baseline campaign object (also the simulated fallback) →
`js/live.js` runs the three live calls and merges results into the same object →
`js/docs.js` renders the nine documents from it (live drafts when present) →
`js/journey.js` renders the scrollable campaign page → `js/app.js` wires views, processing,
power-map interactions, per-document open/edit/copy/download, and source filters.
No chain-of-thought, prompts, model names, token counts or internal errors are shown in the UI.

See `RUNBOOK.md` for the presenter run-of-show.
