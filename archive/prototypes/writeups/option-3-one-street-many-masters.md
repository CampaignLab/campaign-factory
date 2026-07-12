# Option 3 — One Street, Many Masters

**One sentence:** One frozen, citation-bound evidence pack about one Leicester street; toggle the organisation and four opposed campaigns emerge live from identical facts — whose campaign is real?

## User and story

- **User:** a staffer at *each* of four fictional organisations — the point is that it's the same tool.
- **Decision staged:** none of them decides anything; the audience decides what "grassroots" means now.
- **Fear level:** 4/5 — synthetic campaigning and manufactured conflict, demonstrated rather than described.
- This is Hannah's own "an agent per org that spots stuff for them" idea, staged as theatre.

## The four masters (fictional composites — deliberately)

1. **Safe Routes Trust** (blue) — "make the trial permanent"
2. **Residents' Access Alliance** (aqua) — "suspend it pending genuine consultation"
3. **Clean-Air Parents** (yellow) — "extend it to five more schools"
4. **Party ward branch** (violet) — "own the issue by May 2027"

All four cite the same frozen pack EP-041. The factual-drift checker diffs every output against the frozen claims: "frame emphasis — no factual drift detected."

## Ten-minute run of show

| Min | Beat | Screen | Live? |
|---|---|---|---|
| 0–3 | The facts, agreed once | 13 claims, 7 sources, every claim cited; pack frozen — includes the real 59% vs "over 60%" source discrepancy | PRE-CACHED, citation-bound |
| 3–7 | Toggle the master | frames 1 and 2 generated live, side by side: opposite objectives, same citations, same councillor targeted | **LIVE — this is the wow** |
| 7–10 | All four at once | four campaign packs in a grid; "evidence packs used: 1; campaigns: 4; which is grassroots?" | frames 3–4 pre-cached |

## Why it's the safest wow

The live surface is *two model calls against one cached evidence pack*. No live scraping, no API dependency mid-demo, no national scan. If a call fails, the pre-cached frame appears with the CACHED badge — the fallback is indistinguishable from the plan.

## Capability layers shown

prompt → tool-using agent (evidence assembly, done before stage) → fixed workflow (freeze → synthesise → drift-check) → specialised agents (strategy/content per frame) → orchestration (four frames) → factory *(weakest layer: four frames, not four hundred places — see hybrid)*.

## Data spine (verified live, 11 Jul 2026)

Smallest of the four options — one place, one pack:

| Source | Status |
|---|---|
| Leicester CC news + ModernGov + TRO PDFs + Citizen Space consultation page | ✅ OPEN |
| postcodes.io / Parliament API / LCC ward results / Open Council Data | ✅ OPEN |
| ONS / Fingertips / police / STATS19 context | ✅ OPEN |

## Boundary

- **Live:** the frame toggle and both live re-syntheses.
- **Pre-cached:** the frozen pack; frames 3–4.
- **Deterministic:** citation binding; factual-drift diff; approval state.
- **Agent:** per-frame strategy + content; drift judgement calls.
- **Simulated:** the four org profiles; "launched this week" framing.

## MVP / cut list

**MVP:** frozen evidence pack with citations · frame toggle · two live syntheses · drift checker · four-pack grid · approval gate.
**Cut:** issue discovery (pack is pre-built) · maps beyond one pin · national anything · real org names (the one genuinely irresponsible move available — never).

## Risks

| Risk | Mitigation |
|---|---|
| Reads as "AI is a spin machine" — an old point | the drift checker is the counterweight: facts held constant *by code*, only framing moves |
| No scale dimension weakens the factory question | adopt the hybrid: scale frame 4 across 120 wards as the reveal |
| Fictional orgs soften the punch | name real *types* ("a national active-travel charity") without naming orgs |

## Kill criterion

If the live toggle can't produce visibly *opposed* campaigns from the frozen pack in rehearsal (models converging on mush), the concept is dead — fall back to option 1, whose beats don't depend on divergence.
