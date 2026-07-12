# Option 4 — The Consultation Hunter

**One sentence:** The machine watches every open public consultation in the country, catches the deadlines nobody hears about, and drafts cited responses before the windows close — then we ask what participation is worth at machine speed.

## User and story

- **User:** the sole campaigner at any small advocacy org (demo uses a road-safety org for continuity with the Leicester material).
- **Decision they're making:** "which decision windows matter to us, and can we make them all?"
- **New capability:** never missing a statutory deadline again — a thing **no one in the UK can currently do**, because (verified) no consultation aggregator exists.
- **Fear level:** 4/5 — consultation flooding; evidentiary laundering; the asymmetry between machine-drafted input and human officers reading it.

## The two emotional anchors (both verified, both true)

1. **The miss:** Brent's Harris Primary Academy school-street consultation (Norval Rd, Spencer Rd, Nathans Rd, Abbotts Dr, The Link) ran 15 Jun – 7 Jul 2026. It closed **four days before the research was run**. No alert existed. "Hands up who knew."
2. **The catch:** Leicester's St John the Baptist experimental orders have a **live objection window** (~6 months from May 2026) for the permanent orders — the machine catches it with months to spare and drafts the response, surfacing a real discrepancy between official sources (59% support on the scheme page vs "over 60%" in the press release).

## Ten-minute run of show

| Min | Beat | Screen | Live? |
|---|---|---|---|
| 0–3 | The feed nobody has | radar: 71 GOV.UK open consultations (live API), council platforms polled, 19 closing in 14 days, 6 matched to org goals | **LIVE — keyless JSON APIs** |
| 3–7 | The one you missed / the one you won't | Brent (closed, red) vs Leicester (open, 112 days); response drafted with the 59/60 discrepancy handled; submission BLOCKED — human signs | LIVE draft, cached docs |
| 7–10 | Machine-speed participation | 1,400† consultations, 1,400 drafted responses, 40s each, "officers reading them: same" | SIMULATED († labelled on screen) |

## Capability layers shown

Weakest option on agent theatre — the honest framing is the report's own principle inverted: here *software proves and agents only decide*. Deterministic adapters and deadline arithmetic do the impressive part; agents rank relevance and draft. Say so on stage; it's the mature version of the argument.

## Data spine (fully verified live, 11 Jul 2026 — strongest of the four)

| Source | Status | Notes |
|---|---|---|
| GOV.UK search API | ✅ OPEN | keyless JSON; 71 open consultations today; singular `open_consultation` filter |
| Citizen Space (Delib) sites | ✅ OPEN | public JSON API `/api/2.4/json_search_results?st=open` — verified on 4 sites incl. Leicester's own hub |
| Go Vocal / CitizenLab (Brent) | ✅ OPEN | undocumented but open `/web_api/v1/` JSON — Brent project + phase dates verified |
| Commonplace (Westminster etc.) | ⚠️ | parse embedded `__NEXT_DATA__` JSON (~460KB); no public API |
| TfL EngagementHQ hub | ✅ OPEN | server-rendered HTML; Barnes bus case = full lifecycle example (closed Oct 2025 → decision Mar 2026 → implementation Aug 2026) |
| Leicester TRO deposit PDF | ✅ OPEN | the live objection window |
| Cross-council aggregator | ❌ NONE EXISTS | verified gap — simultaneously the pitch and the warning |

## Boundary

- **Live:** GOV.UK + Citizen Space + Go Vocal pulls; relevance ranking; one drafted response with discrepancy surfaced.
- **Pre-cached:** Brent record; TfL Barnes lifecycle; Leicester TRO docs.
- **Deterministic:** platform adapters, deadline arithmetic, citation binding, submission blocking.
- **Agent:** relevance ranking against org goals; drafting; discrepancy handling.
- **Simulated:** the 1,400-consultation national board (real per-platform feeds; the 317-council crawl is not built — † on screen).

## MVP / cut list

**MVP:** GOV.UK adapter · Citizen Space adapter (4 sites) · Go Vocal adapter (Brent) · deadline board · relevance ranker · one drafted response with citations · submission block · national simulation.
**Cut:** Commonplace adapter · 317-council crawl · auto-submission (never) · email alerts · multi-org profiles.

## Risks

| Risk | Mitigation |
|---|---|
| First 3 minutes feel bureaucratic | open with the Brent miss, not the architecture; "hands up who knew" before any screen tour |
| Least agentic of the four — technologists may shrug | own it: "the plumbing is the power" is the panel's most honest provocation |
| A platform API changes before the event | cache every feed nightly from Monday; LIVE badge degrades to CACHED seamlessly |
| Aggregator gap closes (someone ships one) | it becomes a citation, not a problem |

## Kill criterion

If rehearsal audiences don't gasp at the Brent miss, the emotional engine is missing and no amount of dashboard saves it — fold the consultation radar into the winning Leicester option as a single "decision windows" panel and abandon the standalone story.
