# Campaign Factory — presenter run-of-show (live)

Setup before the session: key in `app/.env` → `node app/proxy.js` in a terminal → open
**http://localhost:8787** (the proxy serves the app; same origin, no CORS issues, key stays
server-side). Chip reads "Live mode ready". Open a second tab on
`http://localhost:8787/?auto&skip` (instant finished fallback). Rehearse once end-to-end;
a live run lands in ~6–8 minutes (research ~2 · plan ~2–3 · drafts ~2–3) — the processing
stages give you the talk track for all of it. **Never refresh the tab mid-run** (refresh
aborts the in-flight generation).

## 1. Enter the campaign problem (≈2 min)
- One line: "Campaign Factory takes a local problem, researches it live, and returns a
  complete campaign — objective, power map, strategy, organising plan, and the materials."
- Take an audience suggestion **using the template** on screen ("I want [who] to [what] in
  [where]… "). Type it; add a location. If the room stalls, the prepared example button has
  the Lime-bikes case ready.
- Build campaign.

## 2. Talk over the processing (however long it takes)
The stages tick as the real pipeline runs: interpreting → researching (live web) →
verifying → decision-maker → objective → power → pressure → strategy → tactics →
organising → drafting → checking. Say, roughly:
- why it exists: campaigns aren't content — they're a decision, a decision-maker, pressure,
  and people; the workshops this encodes teach exactly that sequence;
- one shared campaign state connects everything — change the objective and every document
  downstream changes;
- in production this is coordinated specialist components over live public data; today it's
  three model calls with web research, and everything unverifiable is labelled, not invented.
- **If a stage fails**: the red banner is yours — say "this is live", hit **Retry**, or
  **Continue** (the stage falls back to labelled simulated output). Total loss of connectivity →
  the fallback tab.

## 3. Walk the scroll (the bulk of the time)
Use the sticky nav; don't read everything — one beat per stage:
- **Problem** → "the system treats the ask as a hypothesis" (show what it flagged as missing).
- **Research** → the verified situation + a claim card with its source and label.
- **Objective** → read the formula aloud; point at the minimum viable win.
- **Decision** → formal vs practical route.
- **Power** → click 2–3 stakeholders; point at the `?` badge — inferred positions are never
  presented as confirmed.
- **Pressure** → one card: who applies it, through which channel, what activates it.
- **Strategy / Tactics** → the phases; open one tactic (owner, success sign, human approval).
- **Organising** → the ladder; "the machine can draft this; it cannot do this rung."
- **Drafts** → scroll the actual meeting email, press release, social posts; point at a
  `[VERIFY: …]` marker — "unresolved facts stay visible, they don't get invented."

## 4. Close (≈1 min)
- **Documents**: nine cards, one shared plan; download one live.
- **Sources**: filter to "Verification incomplete" — "the system tells you what it doesn't know."
- **How this was built**: input → live research → shared plan → specialist tasks → human
  review → resources. "Human review isn't a disclaimer — local knowledge, judgement,
  relationships and accountability stay with people."

## Library
Every completed run is saved to the **Library** in the menu bar (localStorage on this
machine, newest 20). Rehearsal runs from before the session are therefore available on
stage — if a live run has to be abandoned, a past campaign for the same or a similar
problem can be opened from the Library in one click. `http://localhost:8787/?lib` opens
it directly.

## Contingencies
- Stage failure → banner: Retry / Continue-labelled.
- No key / no network → simulated mode runs the identical journey, clearly labelled.
- Anything else → the `?auto&skip` tab is a finished campaign, instantly.
- Off-scope audience prompt → say so honestly; research will report what it couldn't
  establish — that honesty *is* the demo.
