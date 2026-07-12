# Option 1 — The Scout

**One sentence:** The only campaigner at a two-person road-safety charity types a postcode, and the machine finds the local fight, builds the cited evidence pack, and drafts the campaign — then we reveal it could do this for every school street in England.

## User and story

- **User:** the sole campaigns staffer at a small national road-safety / active-travel charity (fictional composite: "Safe Routes Trust").
- **Decision they're making:** "which local fight should we enter, and with what plan?"
- **New capability:** a week of council-website archaeology compressed into four minutes, with citations.
- **Fear level:** 2/5 — the message is *capacity*. The unease arrives only in the final reveal.

## Ten-minute run of show

| Min | Beat | Screen | Live? |
|---|---|---|---|
| 0–2 | One person, one postcode | LE2 1TE → Castle ward, Leicester South, MP Shockat Adam (Ind); pipeline lights up | LIVE (postcodes.io + Parliament API) |
| 2–6 | The scout finds the fight; we challenge a claim | Issue cards with citations; "parents have demanded" flagged UNSUPPORTED and rewritten | LIVE synthesis over cached index |
| 6–8 | Strategy + content pack | Objective, stakeholders, press release, supporter email — approval gate blocks export | LIVE synthesis, cached evidence |
| 8–10 | Factory reveal | England map, 412 candidate school-street sites, 38 live decision windows, factory queue | SIMULATED on real GIAS seed data |

## Capability layers shown

prompt (issue card summary) → tool-using agent (scout) → fixed workflow (resolve → fetch → verify → rank) → specialised agents (verifier, strategy, content) → orchestration (pipeline view) → factory (national simulation).

## Data spine (verified live, 11 Jul 2026)

| Source | Status | Notes |
|---|---|---|
| Leicester CC news release (28 May 2026) | ✅ OPEN | plain HTML; scheme facts, quotes (headteacher Trudie Colotto, Cllr Geoff Whittle) |
| ModernGov portal (cabinet.leicester.gov.uk) | ✅ OPEN | HTML agendas + PDF attachments, no auth/JS, archive to 2001 |
| TRO deposit PDFs (TME 1028 / TME 2012) | ✅ OPEN | text-extractable; in force 2 Jun 2026 – 1 Dec 2027; objection window ~6 months |
| postcodes.io / NSPL May 2026 | ✅ OPEN | keyless; LE2 1TE → Castle / Leicester South verified |
| Parliament Members API | ✅ OPEN | keyless JSON (the website 403s bots; the API doesn't) |
| ONS census-observations / Nomis / Fingertips / police / STATS19 | ✅ OPEN | all keyless; Fingertips ward-level thin (use LSOA/LA); STATS19 through 2024 |
| GIAS bulk CSV | ✅ OPEN | daily keyless CSV; St John the Baptist = URN 120230, 602 pupils; don't scrape the web UI |
| Leicester Mercury | ⛔ | no article found on scheme; robots-blocks AI crawlers — do not cite |

## Boundary

- **Live:** postcode resolution; scout synthesis; the claim-challenge rewrite.
- **Pre-cached:** all council documents; context datasets; the national scan behind "412".
- **Deterministic:** geography joins, fetch/parse, citation binding, approval state.
- **Agent:** issue ranking, contradiction finding, strategy/content drafting.
- **Simulated:** the national factory queue (real seed list, fake execution).

## MVP / cut list

**MVP:** place resolver · cached Leicester document store · scout with citations · claim-challenge · strategy + 3 content assets · approval gate · national map simulation.
**Cut:** live national scan · media-contact discovery · power-map graph · org toggle · any second location live.

## Risks

| Risk | Mitigation |
|---|---|
| Reveal underwhelms ("nice research tool") | script must land the volunteer-displacement line; panel carries the fear |
| Scout returns weak candidates live | ranked backup issue cards, choose manually — reinforces the approval theme |
| Reads as endorsing the scheme | show the anti-restriction framing exists in the evidence (59% support ≠ unanimity) |

## Kill criterion

If, in rehearsal, non-technical viewers describe it as "like ChatGPT with better sources," the reveal has failed — switch to option 3's toggle or the hybrid.
