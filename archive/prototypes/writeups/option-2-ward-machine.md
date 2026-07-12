# Option 2 — The Ward Machine

**One sentence:** A party field organiser is assigned a target ward they've never visited; the machine finds the local issue that moves voters there, writes the doorstep script, and then we reveal it running across every battleground ward in the country — with zero local volunteers consulted.

## User and story

- **User:** a regional field organiser for an *unnamed* party, assigned Castle ward (Leicester) for May 2027.
- **Decision they're making:** "what do I campaign on in a place I don't know, with no local members?"
- **New capability:** local knowledge without locals. This is Ed's original notes made flesh: "650 CLPs… strategy centrally → locally the agents… maybe you'll need less volunteers."
- **Fear level:** 5/5 — issues chosen for electoral utility; volunteer displacement; manufactured locality.

## The verified terrain (this is why it works)

- Castle ward: Green-held since May 2023 (Kitterick 1,564 / Gregg 1,453 / Sahu 1,419; turnout 30.4%); all seats up May 2027.
- The school street **straddles the Castle/Knighton boundary** — Green-held Castle on one side, Labour-held Knighton on the other; the councillor fronting the scheme (Geoff Whittle, Assistant City Mayor) sits for **Knighton**. A real two-party fault line runs down the middle of the street.
- MP: Shockat Adam (Ind), Leicester South. All verified live 11 Jul 2026.

## Ten-minute run of show

| Min | Beat | Screen | Live? |
|---|---|---|---|
| 0–2 | A ward you've never visited | ward brief: held-by, turnout, next election, "local volunteers: 0" | LIVE (geo + electoral joins) |
| 2–6 | The machine picks the issue — for electoral reasons | issues ranked by "voter resonance"†; doorstep script drafted; review flag catches invented social proof ("some neighbours told us") | LIVE synthesis over cached records |
| 6–8 | Audience frames | broad non-sensitive segments only: parents / boundary-road residents / renters | LIVE |
| 8–10 | Battleground reveal | 120 target wards, each with its own found issue and script; "volunteers consulted: 0"; "who reads 120 approvals?" | SIMULATED on real CC0 ward data |

† resonance scores are methodologically synthetic and must be admitted on stage.

## Capability layers shown

Same six-layer ladder as option 1, plus the sharpest approval-gate beat of any option: the machine invents social proof, the review agent flags it, a human keeps it out. Then the reveal asks whether 120 approvals per day is a gate or a rubber stamp.

## Data spine (verified live, 11 Jul 2026)

Everything in option 1's spine, plus:

| Source | Status | Notes |
|---|---|---|
| Leicester CC 2023 ward results | ✅ OPEN | HTML tables, 21 wards, easy scrape |
| Open Council Data UK | ✅ OPEN | CC0 CSVs, updated 11 Jul 2026; incumbents/parties/next elections, all GB — feeds the 120-ward reveal with real names |
| Commons Library ward-results bulk dataset | ⚠️ | exists, 403s bots — one manual browser download |
| Democracy Club API | ⚠️ | key required, private beta; optional — request early or skip |

## Boundary

- **Live:** geography + electoral context; issue ranking over cached records; script drafting; review flag.
- **Pre-cached:** council documents; ward results; councillor CSV; other wards' pre-run packs.
- **Deterministic:** joins, citation binding, approval state, banned-tactic checks.
- **Agent:** resonance ranking, frame selection, drafting, contradiction flags.
- **Simulated:** the 120-ward queue (real ward names + incumbents, fake execution); resonance methodology.

## MVP / cut list

**MVP:** ward brief page · issue ranker with citations · doorstep script + review flag · broad audience frames · battleground simulation on CC0 data · approval gate.
**Cut:** real resonance modelling · candidate data (Democracy Club) · MP lobbying pack · any named party · individual-level anything.

## Risks

| Risk | Mitigation |
|---|---|
| Reads as a product pitch for astroturfing | stage it explicitly as "look straight at what's coming"; presenter never says "you should do this" |
| Real people on screen (incumbents, school) | public-role facts only; no inferred motives; party unnamed; consider anonymising the reveal wards |
| Ethics blowback lands on Newspeak/Campaign Lab | requires Ed + Hannah's explicit pre-approval; this is decision #2 on the compare page |
| "Resonance" methodology challenged from the floor | label it synthetic on the slide itself; that honesty *is* the demo's credibility |

## Kill criterion

If Ed or Hannah hesitates on the electoral framing for more than a day, don't negotiate it down into a mushy compromise — switch to the hybrid (option 3's beats with this option's reveal), which delivers 80% of the fear at 40% of the heat.
