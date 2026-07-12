# Archive — previous Campaign Factory prototypes

Preserved, inspectable, and deliberately **absent from the live application** (`app/`).
Open any HTML file directly; internal relative links work within each version.

## Map (vs the suggested layout)

The four concepts share stylesheets and cross-link at the same state, so they are archived
as complete version trees rather than split per concept:

| Suggested | Actual location |
|---|---|
| `prototypes/scout/` | `prototypes/option-1-scout.html` (v3/v4) · `prototypes/_v2/option-1-scout.html` (stage click-through) · `prototypes/_v1/option-1-scout.html` (storyboard) |
| `prototypes/ward-machine/` | same pattern, `option-2-ward-machine.html` |
| `prototypes/one-street-many-masters/` | same pattern, `option-3-…` |
| `prototypes/consultation-hunter/` | same pattern, `option-4-…` |
| `prototypes/previous-indexes/` | `prototypes/index.html` (v3/v4 launcher) · `prototypes/_v2/index.html` · `prototypes/_v1/index.html` |
| `prototypes/decision-matrix/` | `prototypes/_v1/compare.html` (scores, tie-break, hybrid) |

Also preserved:

- `prototypes/campaign-planner.html` — the v4 end-to-end campaign journey (the nine-document
  app in `app/` is its direct successor; the planner retains the specialist-agent disagreement
  panels that the live app intentionally omits).
- `prototypes/CAMPAIGN-WORKFLOW.md` — nine-specialist synthesis, disagreement log, demo script.
- `prototypes/REBUILD-SPEC.md` — v2 design-review synthesis (IA/interaction/visual/copy).
- `writeups/` (also copied to `prototypes/writeups/` so `_v1` relative links resolve) —
  long-form concept write-ups with build scopes and kill criteria.

## Version history

- **v1** (`prototypes/_v1/`) — document-style storyboards + decision matrix, dark theme.
- **v2** (`prototypes/_v2/`) — full-screen stage click-throughs, 8 states, Base UI-convention kit.
- **v3/v4** (`prototypes/` root) — single-page capability-ladder diagrams (Awake/shadcn tokens),
  then the campaign-planner rework on the workshop frameworks.
- **Live app** — `../app/` — one focused UK campaign factory, nine documents, no meta-AI content.
