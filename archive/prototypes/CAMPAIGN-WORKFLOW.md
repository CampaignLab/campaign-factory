# Campaign workflow synthesis (v4)

The record behind `campaign-planner.html` — synthesised from the two workshop decks and nine
specialist-agent reviews (12 Jul 2026). This is the campaign logic; the HTML is its interface.

## Frameworks extracted from the decks

**How Technology Shapes Campaign Strategy and Tactics:** three stages — sense-making (goals &
power) → tactics & pressure → organising people. Check-in formula: *"We want [decision-maker] to
[specific action] by [time], even if the outcome is only [limited win]."* Name the meeting/office/
decision-maker/timeframe/minimum acceptable outcome; what don't we know yet. Pressure = making the
status quo costlier than change; match tactics to risks decision-makers avoid (electoral /
reputational / internal / legal); sequence so pressure builds. Methodologies: power mapping,
pillars of power, theory of change, SMART, minimum viable win, stakeholder & resource mapping,
relational organising, one-to-ones, ladder of engagement, coalition/distributed/community/
membership/movement building. Tech is a helper per stage — and sometimes *"No Tech Needed."*
Worked example #HonourTheOffer: pick a target that can break; league table pits targets against
each other; open letter + form; seed via WhatsApp networks to threshold; copyable format.

**Political Organising workshop:** Objective / Strategy / Tactics distinction. Six steps: goal
(5 whys, imagining success, SMART, ToC) → decision-maker(s) ("what will make them break? where
will pressure work?") → resources & challenges (stakeholders, physical/tech resources, networks,
team) → path(s)/channels to the decision-maker → tactics (what tech/you/allies can do) →
measurement ("It just fails. Metrics — think hard. Retros. Iteration — keep trying.").

## Gaps in the pre-v4 prototypes (consensus across all nine specialists)

1. Wrong altitude on decision-makers: MP/ward prominence; the officer–portfolio–mayor chain absent.
2. No objective, no minimum viable win, no statutory clock (the Nov 2026 window was invisible).
3. Stage 2 skipped: no pressure theory, no route, no sequencing, no opponent model.
4. Stage 3 absent: supporters were recipients of content, not owners; no ladder, roles, or tracking.
5. Content generated before strategy; assets had no purpose/target/doer/branch.
6. No assumption discipline on political inferences (citations covered documents only).

## The nine specialists and their headline recommendations

| Specialist | Headline recommendation |
|---|---|
| Campaign strategy | Objective in check-in format naming Smith-via-Whittle and the Nov 2026 window; MVW = support outnumbers objections on the statutory record; SMART checker blocks "raise awareness" |
| Power & political analysis | Strong-mayor chain (officers → Whittle → Soulsby); MP demoted to megaphone; 10-entry prioritised power map with must-move / can-move-them / mobilises / resists |
| Tactics & escalation | 4 phases Jul→Nov, 8 tactics each with succeed/fail branches; scorecard + live counter as the creative play; contingency for opponent flooding |
| Political lobbying | Officers first, Whittle second, councillor letter as cover, MP last; arguments ranked for the decider (their own "over 60%" line, cheaper permanent design, cross-party cover, precedent); never weaponise the 59/60 discrepancy |
| Organising | Supporter ladder with the council response as first action; 4 volunteer roles; 5-beat one-to-one; 150 authored responses beat 500 near-duplicates |
| Local media | Story unclaimed (verified no coverage) — set the frame first; angles ranked (first-day-back photo op top); never fabricate journalists or imply coverage |
| Digital mobilisation | One-action page with required personalisation (officers must weigh material individual points); realistic funnel (~40–70 responses/push × 3); thermometer mechanic; never auto-send |
| Campaign technology | Tech honesty per stage: factory earns its keep at evidence pack + window radar + engagement tracking; spreadsheets/WhatsApp suffice elsewhere; "No Tech Needed" for judgement calls; 3 reusable meta-tools |
| Verification & risk | Six highest-risk artifacts; approval matrix (internal / external / never-auto); stated / inferred / unknown badges with reasoning + expiry; safeguarding rule at school gates |

## Disagreements preserved on the record (and resolutions)

1. **Route** — tactics (public scorecard) vs power+lobbying (insider, fill the statutory record).
   → Route A default; Route B pre-built, human-triggered at the October checkpoint; scorecard ranks schemes, never people.
2. **The 59/60 discrepancy** — verifier (best-evidenced finding) vs lobbying (never use) vs media (only if campaign initiates the correction). → Held as corrected footnote; never lead.
3. **Volume vs authenticity** — digital (semi-personalised scale) vs organising (authored responses + structure). → Class reps deliver the digital asset; personalisation fields required; no auto-send.
4. **Scorecard naming** — tactics vs verification. → Schemes and streets, never councillors.
5. **Does the factory belong?** — tactics (replication is the product) vs campaign tech (anti-persuasive for a single local decision). → Win one street first; the playbook replicates, not the factory. The conference demo shows the factory as the panel's question, not the campaign's answer.

## The end-to-end workflow (as built)

Issue & evidence (stated/unknown) → Sense-making (5 whys, decision chain in practice, window)
→ Objective & decision check (check-in formula, SMART gate, MVW, ToC) → Power & stakeholder map
(badged positions, asks, approach-via) → Pressure & route (risk profiles per decider, Route A/B
choice) → Strategy (narrative, phases, resources, failing signals) → Tactics & sequencing (4
phases, branches, tech tests) → Organising (ladder, roles, one-to-ones, human/tech split) →
Resources (6 packs, agent-attributed, approval-gated) → Measurement, risks, export (real metrics,
retros, inference expiry, 5-gate export block).

## Simulated / incomplete

No working runtime: agent contributions, regeneration, engagement tracking, and export are
click-through affordances on specialist-seeded data. "Safe Routes Trust" is fictional. All civic
facts are real and were live-verified 11 Jul 2026. Funnel percentages are practitioner estimates,
labelled. The four concept pages remain ladder demos, now linked as feeder modules to planner stages.

## Running it

Open `storyboards/index.html` → Campaign Planner (or any concept page). Scroll or ←/→ through
stages; rail dots jump; `?all` reveals everything at once. Zero dependencies; works offline
(fonts degrade to Arial/Georgia).

## Suggested 10-minute demo (issue → campaign)

1. Scout rungs 1–3 (2 min): postcode → cited evidence → the window found.
2. Cut to planner stage 3 (2 min): the naive objective rejected by the SMART gate; the check-in
   formula filled with the real decider and deadline.
3. Stage 4–5 (2 min): the power map with inferred badges; the route disagreement — audience votes A or B.
4. Stage 7–8 (2 min): the October tactic with its fail branch; the supporter ladder — "the machine
   can't do this rung."
5. Stage 10 + question card (2 min): metrics we refuse; export gates; "nine agents drafted this
   plan in minutes; it still cannot win without thirty parents at a school gate."

## Next steps toward a reusable system

1. Implement the shared campaign object (JSON schema) the packs read from; wire real generation behind the existing gates.
2. Build the three meta-tools first (decision-window radar, evidence-pack builder, personalised-response drafter) — they transfer to any local campaign.
3. Engagement tracking (ladder stages, nudges) as the organising backbone; never auto-send.
4. Pilot on one real campaign with a real owner after the conference, with the September-retro discipline built in.
