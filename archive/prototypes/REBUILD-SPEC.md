# Prototype rebuild spec (v2) — synthesis of four design reviews

Format decision (locked): guided tour of a pre-built factory — "one question, six machines."
V1 archived in `_v1/`. Long-form docs remain in `../writeups/`.

## Shared skeleton — every prototype has 8 states

S0 title card · S1 model only · S2 +tools · S3 +workflow · S4 +specialists (the wow, whole screen)
· S5 approval gate · S6 factory view · S7 question card.

## Navigation (presenter + reviewer)

- → / space = advance (internal reveal steps first, then next state); ← = back; 1–8 = jump to state.
- `[` `]` = switch prototype **at the same state** ("same question, different machine").
- `i` = About drawer; Esc closes overlays. URL hash per state (`#s4`). `?all` reveals every step (review mode).
- Dot stepper bottom-centre, labels on hover.

## Interaction rules

- Time becomes clicks: nothing pre-resolved; the flag/fix appears after the presenter acts.
- One dominant primary action per screen.
- Agent activity = vertical task checklist with human-readable status lines; streaming text reserved
  for generated outputs only. No node graphs, no real maps, no working exports, no free-text driving generation.
- Approval = modal (Approve / Request changes / Reject); all export buttons disabled until resolved.
- One scripted deterministic error per prototype ("Couldn't reach X — Use cached (11 Jul)").
- Citations = click chips → popover with source, date, excerpt, provenance.
- Factory wall: ~120–400 cells of REAL place names; only a small wave animates; label
  "Simulated run · real places". Illegible by design; one 140px counter floats over it.

## Visual system

Type: hero 140px / stat 64px / h1 48px / section 32px / body 22px / label 18px — nothing under 18px.
Spacing: 96px page sides, 64px between blocks, 32px between panels. Full-bleed, no max-width cap.
Palette: keep v1 hexes. Provenance = 3 classes, max one marker per container:
- **Real data** — 4px blue left border; `Live` pulsing dot or `Cached 11 Jul 09:14`.
- **Generated** — 4px violet border, violet-tinted surface #1f1d26; simulated adds dashed border.
- **Human gate** — orange, a full-width approval bar (layout element, not badge).
Citations are evidence, not provenance: 18px blue chips/links.

## Voice

States, counts, timestamps on screen; thesis lines in the presenter script (S0/S7 cards + speaker notes only).
Banned in chrome: rhetorical questions, aphorisms, editorial tile subtext, "surfaced and handled"-style LLM-ese.
Microcopy: `Live` · `Cached 11 Jul` · `Generated` · `Running · fetching council minutes` · `Needs review` ·
`Failed · source unreachable` · `Done · 41s` · `Export blocked · 1 draft awaiting review` · `Approved · ready to export` ·
`Unsupported — no source. Reworded to match citation.`
Generated artifacts: ≤90 words visible, middle elided, exactly one plausible defect each.

## About drawer (per prototype, `i`)

User · problem · demo idea · flow · live/cached/deterministic/agentic/simulated table · benefits ·
risks & tensions · build complexity · 10-minute-demo fit. Never auto-opens. Base UI note: kit mirrors
Base UI component vocabulary (tabs/dialog/popover/collapsible/progress); production swaps to
@base-ui-components/react one-to-one.
