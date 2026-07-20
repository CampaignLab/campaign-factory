# Show-readiness report — 16 July 2026, night shift

**Verdict: READY.** Every item of the 4-hour mandate is done, deployed to production, and verified. The system is frozen as of ~02:55 BST — no further changes will be made without you. Evidence screenshots: `web/test-results/show/`.

## 1. Design rebuild — done, reviewed, fixed, re-deployed

- The campaign brief page **is the legacy design**: rail, rung anatomy (number badge · serif-italic titles · step explainers · principle notes, no agent chips), legacy block vocabulary (callouts, framed evidence card with plain-language label pills, route diagram, power map, tactics accordion), plus the grafts — Agent Build Bar (live), Decision point cards, slim graded receipt, graded document pills, Word export.
- New rail steps: **Sources** (full register, collapsed, tier-grouped, hostnames for scraper-failure titles) and **Next steps** (fact-check categories, all collapsed) — the old bottom roll-up is gone.
- Independent Opus review judged theme/rail/anatomy/hero/grafts **indistinguishable from the legacy page**; its one systemic finding (evidence-step raw-data dump) plus mobile overflow and entity glitches were **fixed and re-deployed** (evidence step now renders *lighter* than the legacy equivalent: 997px vs ~1780px).
- Homepage: legacy language, purple-framed form, coloured CTA; the "Optimised for UK…" paragraph is gone. **/how** rebuilt as a legacy rail page with the GitHub link on top. Campaign **names lead everywhere** (heroes, tab titles, gallery cards, anchors, receipts); place is the caption.
- Surface QA (second Opus reviewer): **7/7 areas PASS, zero console errors**, phones stack correctly.

## 2. The show recording — pinned at /replay

Show batch `1ebf71d3` (02:02–02:29 BST, express, 23-min cap): **usable 3 of 3, 27/27 sections across the batch** — the strongest run to date.

| Campaign | Sections | Documents ready | Agent failures |
|---|---|---|---|
| Save Great North Leisure Park (Barnet) | 9/9 **COMPLETED** | 9/9 | 0 |
| Tower Hamlets Affordable Homes | 9/9 | 8/9 | 1 (one producer; honest gap) |
| No KFC at Hattersley Centre (Ormskirk) | 9/9 | 8/9 | 1 (same class) |

Cost $8.83. Promoted as **"Recorded real run · 2026-07-16"** — `/replay` verified serving it: campaign-name anchors, condensed **27 min → 15:00**, opens at 4x, autoscroll working, end state shows graded labels (never "partial").

## 3. Audience path — tested end-to-end through the real UI (phone viewport)

Real run, real research (Beaumont Leys crossing, Leicester): intake form → validation → submit → **redirect in 5s** → build bar + skeletons live → **9/9 sections in 20.0 minutes, zero agent failures, $1.39** → brief titled "Reopen the Beaumont Way Crossing", graded **Complete**, 3 documents Ready + 6 Check-before-use. Public solo runs correctly do **not** appear in /gallery (privacy by design). Screenshots: `show/show-audience-*.png`.

## 4. The four screens, as they stand

| Screen | URL | State |
|---|---|---|
| Factory Builder | `/factory` (homepage redirects) | New legacy-styled intake, validated live tonight |
| Campaign Gallery | `/gallery` | 6 deduped cards, graded pills, no mock/test runs |
| Multi-campaign demo | `/presenter` → `/factory/multi-campaign-demo` | Code-free, 1–5 intake; exercised by tonight's batch |
| Session replay | `/live` or `/replay` | Tonight's 3-campaign recording, condensed 15:00 @4x |

`/factory/live` = real-time mirror (currently shows the finished show batch, all workspaces browsable). `/legacy` = old builder, unlinked.

## 5. Costs & limits

Night shift: ~$10.30 (batch $8.83 + audience test $1.39). Running total well under the £150/day ceiling; 15–40 audience runs today ≈ $30–80 — comfortable. Express: 23-min hard cap, finished work always gets its final review.

## 6. Known minor items (deliberately NOT touched — all cosmetic)

1. Gallery's Tooting card uses raw problem text as title (older run without a generated name) and sits near a similar legacy card.
2. Generic `<title>` on `/factory`, `/gallery`, `/legacy` (only brief pages, /how and /replay have bespoke titles).
3. Reviewer work-logs inside replay workspaces contain the word "failed" in prose (agent transcripts, not labels).
4. Tower Hamlets/Ormskirk each have one honest "Still being written" pack in tonight's recording — visible if someone opens their document steps in the replay.

## 7. If something breaks before the session

- Production web redeploy: merge `factory/multi-agent-build` → `main` (auto-builds), or `npx vercel promote <last-good-url>` from `web/` for instant rollback.
- Worker: `railway up` from repo root; verify `/health` uptimeSec resets below 120 before firing anything.
- The pinned replay is immutable and survives everything — worst case, the session runs on `/replay` alone.
- On-stage batch: open `/presenter`, enter up to 5 campaigns, fire; audience watches `/factory/live`; ~20–27 min to full briefs.

Good show. 🏭
