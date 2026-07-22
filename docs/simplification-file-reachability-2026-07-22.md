# Dependency reachability audit

> This is the pre-cleanup baseline inventory. The post-cleanup traversal and
> architecture findings are recorded in `code-pattern-audit-2026-07-22.md`.
> After the product-level retirement of the tracked `app/` and `archive/`
> trees, the maintained traversal covers 235 runtime files, 16 support files,
> and five migrations with zero unreachable candidates. Its five unresolved
> edges are all intentional reads of ignored `.env.local` files.

Scanned 281 files from `web/src`, `worker/src`, `web/scripts`, `web/tests`, `app`, `db/factory`.
Reachability is candidate evidence, not a deletion verdict.

| Disposition | Files |
| --- | ---: |
| runtime-reachable | 253 |
| support-only | 16 |
| standalone-artifact | 5 |
| unreachable-candidate | 7 |

Unresolved internal import edges: 7.

## File inventory

| File | Initial disposition | DFS post-order | Lines | In | Out | Root reason | Unresolved internal imports |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| `app/css/app.css` | runtime-reachable | 1 | 307 | 2 | 0 |  |  |
| `app/data/authorities.data.js` | runtime-reachable | 2 | 46 | 2 | 0 |  |  |
| `app/data/media.data.js` | runtime-reachable | 3 | 32 | 2 | 0 |  |  |
| `app/index.html` | runtime-reachable | 11 | 154 | 0 | 10 | HTML entrypoint | `local-key.js` |
| `app/js/adapters.js` | runtime-reachable | 4 | 53 | 2 | 0 |  |  |
| `app/js/app.js` | runtime-reachable | 5 | 365 | 2 | 0 |  |  |
| `app/js/docs.js` | runtime-reachable | 6 | 362 | 2 | 0 |  |  |
| `app/js/engine.js` | runtime-reachable | 7 | 363 | 2 | 0 |  |  |
| `app/js/export.js` | runtime-reachable | 8 | 57 | 2 | 0 |  |  |
| `app/js/journey.js` | runtime-reachable | 9 | 294 | 2 | 0 |  |  |
| `app/js/live.js` | runtime-reachable | 10 | 379 | 2 | 0 |  |  |
| `app/proxy.js` | runtime-reachable | 12 | 67 | 0 | 0 | explicit entry |  |
| `app/server.mjs` | runtime-reachable | 13 | 112 | 0 | 0 | explicit entry |  |
| `app/smoke-campaign.data.js` | runtime-reachable | 14 | 1645 | 1 | 0 |  |  |
| `app/smoke.html` | runtime-reachable | 15 | 138 | 0 | 11 | HTML entrypoint | `local-key.js` |
| `db/factory/migrations/001_schema_and_identity.sql` | standalone-artifact |  | 26 | 0 | 0 | standalone SQL artifact |  |
| `db/factory/migrations/002_runs_and_events.sql` | standalone-artifact |  | 110 | 0 | 0 | standalone SQL artifact |  |
| `db/factory/migrations/003_evidence.sql` | standalone-artifact |  | 88 | 0 | 0 | standalone SQL artifact |  |
| `db/factory/migrations/004_state_and_proposals.sql` | standalone-artifact |  | 94 | 0 | 0 | standalone SQL artifact |  |
| `db/factory/migrations/005_documents_artefacts_ledger_replay.sql` | standalone-artifact |  | 84 | 0 | 0 | standalone SQL artifact |  |
| `web/scripts/check-neon.mjs` | support-only | 1 | 25 | 0 | 0 | test/script/check convention | `../.env.local` |
| `web/scripts/gallery.mjs` | support-only | 2 | 23 | 0 | 0 | test/script/check convention | `../.env.local` |
| `web/scripts/promote-replay.mjs` | support-only | 3 | 317 | 0 | 0 | test/script/check convention | `../.env.local` |
| `web/scripts/seed-fixture.mjs` | support-only | 5 | 29 | 0 | 1 | test/script/check convention |  |
| `web/scripts/verify-judgement.mjs` | support-only | 6 | 369 | 0 | 0 | test/script/check convention |  |
| `web/scripts/verify-shared-brief.mjs` | support-only | 7 | 107 | 0 | 0 | test/script/check convention |  |
| `web/src/app/admin/page.tsx` | runtime-reachable | 23 | 69 | 0 | 4 | framework convention |  |
| `web/src/app/api/admin/hide/route.ts` | runtime-reachable | 28 | 16 | 0 | 2 | framework convention |  |
| `web/src/app/api/factory/_lib/worker.ts` | runtime-reachable | 32 | 123 | 9 | 2 |  |  |
| `web/src/app/api/factory/batches/[batchId]/route.ts` | runtime-reachable | 39 | 47 | 0 | 4 | framework convention |  |
| `web/src/app/api/factory/batches/route.ts` | runtime-reachable | 41 | 70 | 0 | 3 | framework convention |  |
| `web/src/app/api/factory/present/route.ts` | runtime-reachable | 42 | 94 | 0 | 2 | framework convention |  |
| `web/src/app/api/factory/present/session.ts` | runtime-reachable | 33 | 69 | 7 | 0 |  |  |
| `web/src/app/api/factory/runs/[id]/cancel/route.ts` | runtime-reachable | 43 | 37 | 0 | 2 | framework convention |  |
| `web/src/app/api/factory/runs/[id]/documents/route.ts` | runtime-reachable | 57 | 41 | 0 | 6 | framework convention |  |
| `web/src/app/api/factory/runs/[id]/judgements/[jid]/route.ts` | runtime-reachable | 58 | 47 | 0 | 1 | framework convention |  |
| `web/src/app/api/factory/runs/[id]/route.ts` | runtime-reachable | 59 | 24 | 0 | 3 | framework convention |  |
| `web/src/app/api/factory/runs/route.ts` | runtime-reachable | 65 | 126 | 0 | 6 | framework convention |  |
| `web/src/app/api/runs/[id]/route.ts` | runtime-reachable | 77 | 32 | 0 | 4 | framework convention |  |
| `web/src/app/api/runs/[id]/share/route.ts` | runtime-reachable | 78 | 20 | 0 | 2 | framework convention |  |
| `web/src/app/api/runs/route.ts` | runtime-reachable | 79 | 124 | 0 | 6 | framework convention |  |
| `web/src/app/api/status/route.ts` | runtime-reachable | 80 | 26 | 0 | 5 | framework convention |  |
| `web/src/app/api/wall/route.ts` | runtime-reachable | 81 | 9 | 0 | 1 | framework convention |  |
| `web/src/app/c/[id]/page.tsx` | runtime-reachable | 83 | 17 | 0 | 2 | framework convention |  |
| `web/src/app/dev/preview/page.tsx` | runtime-reachable | 85 | 17 | 0 | 3 | framework convention |  |
| `web/src/app/error.tsx` | runtime-reachable | 86 | 63 | 0 | 0 | framework convention |  |
| `web/src/app/factory/admin/costs/page.tsx` | runtime-reachable | 99 | 236 | 0 | 3 | framework convention |  |
| `web/src/app/factory/c/[campaignId]/actions.ts` | runtime-reachable | 106 | 23 | 1 | 3 |  |  |
| `web/src/app/factory/c/[campaignId]/briefRegister.ts` | runtime-reachable | 105 | 25 | 2 | 4 |  |  |
| `web/src/app/factory/c/[campaignId]/page.tsx` | runtime-reachable | 128 | 92 | 0 | 7 | framework convention |  |
| `web/src/app/factory/dev/documents-preview/DocumentsPreview.tsx` | runtime-reachable | 134 | 119 | 1 | 8 |  |  |
| `web/src/app/factory/dev/documents-preview/page.tsx` | runtime-reachable | 135 | 12 | 0 | 1 | framework convention |  |
| `web/src/app/factory/dev/gallery-preview/GalleryPreviewClient.tsx` | runtime-reachable | 163 | 76 | 1 | 4 |  |  |
| `web/src/app/factory/dev/gallery-preview/fixtures.ts` | runtime-reachable | 136 | 303 | 1 | 1 |  |  |
| `web/src/app/factory/dev/gallery-preview/page.tsx` | runtime-reachable | 164 | 15 | 0 | 1 | framework convention |  |
| `web/src/app/factory/dev/preview/FixturePreview.tsx` | runtime-reachable | 166 | 112 | 1 | 6 |  |  |
| `web/src/app/factory/dev/preview/page.tsx` | runtime-reachable | 167 | 11 | 0 | 1 | framework convention |  |
| `web/src/app/factory/factory-intake.module.css` | runtime-reachable | 174 | 140 | 1 | 0 |  |  |
| `web/src/app/factory/gallery/[batchId]/GalleryBoot.tsx` | runtime-reachable | 168 | 94 | 1 | 1 |  |  |
| `web/src/app/factory/gallery/[batchId]/page.tsx` | runtime-reachable | 169 | 24 | 0 | 2 | framework convention |  |
| `web/src/app/factory/live/LiveBoot.tsx` | runtime-reachable | 170 | 20 | 1 | 1 |  |  |
| `web/src/app/factory/live/page.tsx` | runtime-reachable | 171 | 49 | 0 | 3 | framework convention |  |
| `web/src/app/factory/multi-campaign-demo/PresenterEntry.tsx` | runtime-reachable | 172 | 238 | 1 | 2 |  |  |
| `web/src/app/factory/multi-campaign-demo/page.tsx` | runtime-reachable | 173 | 25 | 0 | 2 | framework convention |  |
| `web/src/app/factory/page.tsx` | runtime-reachable | 177 | 283 | 0 | 7 | framework convention |  |
| `web/src/app/factory/present/page.tsx` | runtime-reachable | 178 | 9 | 0 | 0 | framework convention |  |
| `web/src/app/factory/replay/conference/ReplayClient.tsx` | runtime-reachable | 183 | 332 | 1 | 6 |  |  |
| `web/src/app/factory/replay/conference/page.tsx` | runtime-reachable | 184 | 66 | 0 | 5 | framework convention |  |
| `web/src/app/gallery/compose.ts` | runtime-reachable | 185 | 124 | 1 | 0 |  |  |
| `web/src/app/gallery/page.tsx` | runtime-reachable | 186 | 226 | 0 | 5 | framework convention |  |
| `web/src/app/global-error.tsx` | runtime-reachable | 187 | 67 | 0 | 0 | framework convention |  |
| `web/src/app/globals.css` | runtime-reachable | 190 | 238 | 1 | 0 |  |  |
| `web/src/app/how/HowJourney.tsx` | runtime-reachable | 188 | 445 | 1 | 0 |  |  |
| `web/src/app/how/page.tsx` | runtime-reachable | 189 | 21 | 0 | 1 | framework convention |  |
| `web/src/app/journey.css` | runtime-reachable | 129 | 237 | 2 | 0 |  |  |
| `web/src/app/layout.tsx` | runtime-reachable | 193 | 52 | 0 | 4 | framework convention |  |
| `web/src/app/legacy/page.tsx` | runtime-reachable | 198 | 14 | 0 | 1 | framework convention |  |
| `web/src/app/live/page.tsx` | runtime-reachable | 199 | 10 | 0 | 0 | framework convention |  |
| `web/src/app/page.tsx` | runtime-reachable | 200 | 9 | 0 | 0 | framework convention |  |
| `web/src/app/presenter/page.tsx` | runtime-reachable | 201 | 8 | 0 | 0 | framework convention |  |
| `web/src/app/replay/page.tsx` | runtime-reachable | 202 | 8 | 0 | 0 | framework convention |  |
| `web/src/app/wall/page.tsx` | runtime-reachable | 203 | 9 | 0 | 0 | framework convention |  |
| `web/src/components/CampaignApp.tsx` | runtime-reachable | 197 | 200 | 1 | 7 |  |  |
| `web/src/components/EntryForm.tsx` | runtime-reachable | 194 | 185 | 1 | 4 |  |  |
| `web/src/components/Journey.tsx` | runtime-reachable | 82 | 748 | 3 | 2 |  |  |
| `web/src/components/LabelChip.tsx` | unreachable-candidate |  | 37 | 0 | 1 |  |  |
| `web/src/components/OwnerBar.tsx` | runtime-reachable | 195 | 80 | 1 | 3 |  |  |
| `web/src/components/Reveal.tsx` | unreachable-candidate |  | 50 | 0 | 0 |  |  |
| `web/src/components/RunProgress.tsx` | runtime-reachable | 196 | 139 | 1 | 3 |  |  |
| `web/src/components/SiteFooter.tsx` | runtime-reachable | 191 | 24 | 1 | 0 |  |  |
| `web/src/components/SiteNav.tsx` | runtime-reachable | 192 | 52 | 1 | 0 |  |  |
| `web/src/components/factory/assembly/AgentBuildBar.tsx` | runtime-reachable | 112 | 94 | 1 | 1 |  |  |
| `web/src/components/factory/assembly/AssemblyClient.tsx` | runtime-reachable | 127 | 144 | 1 | 4 |  |  |
| `web/src/components/factory/assembly/AssemblyView.tsx` | runtime-reachable | 126 | 418 | 2 | 14 |  |  |
| `web/src/components/factory/assembly/BriefSection.tsx` | runtime-reachable | 118 | 93 | 1 | 5 |  |  |
| `web/src/components/factory/assembly/ConnectionBadge.tsx` | runtime-reachable | 119 | 26 | 1 | 1 |  |  |
| `web/src/components/factory/assembly/DocumentLibrary.tsx` | runtime-reachable | 120 | 53 | 1 | 2 |  |  |
| `web/src/components/factory/assembly/NextStepsSection.tsx` | runtime-reachable | 121 | 206 | 1 | 5 |  |  |
| `web/src/components/factory/assembly/SectionContent.tsx` | runtime-reachable | 114 | 1050 | 1 | 5 |  |  |
| `web/src/components/factory/assembly/SourcesSection.tsx` | runtime-reachable | 122 | 181 | 1 | 4 |  |  |
| `web/src/components/factory/assembly/assembly.css` | runtime-reachable | 123 | 335 | 1 | 0 |  |  |
| `web/src/components/factory/assembly/briefData.ts` | runtime-reachable | 104 | 99 | 7 | 1 |  |  |
| `web/src/components/factory/assembly/stepCopy.tsx` | runtime-reachable | 115 | 150 | 4 | 1 |  |  |
| `web/src/components/factory/cards/AgentIdentityPill.tsx` | runtime-reachable | 142 | 67 | 1 | 5 |  |  |
| `web/src/components/factory/cards/AgentWorkCard.tsx` | runtime-reachable | 144 | 320 | 1 | 6 |  |  |
| `web/src/components/factory/cards/CompactAgentCard.tsx` | runtime-reachable | 145 | 147 | 1 | 6 |  |  |
| `web/src/components/factory/cards/cardAdapter.ts` | runtime-reachable | 146 | 168 | 1 | 3 |  |  |
| `web/src/components/factory/cards/chrome.ts` | runtime-reachable | 137 | 42 | 4 | 1 |  |  |
| `web/src/components/factory/cards/factory.module.css` | runtime-reachable | 138 | 196 | 5 | 0 |  |  |
| `web/src/components/factory/cards/format.ts` | runtime-reachable | 143 | 22 | 3 | 0 |  |  |
| `web/src/components/factory/cards/hues.ts` | runtime-reachable | 140 | 79 | 4 | 1 |  |  |
| `web/src/components/factory/cards/icons.tsx` | runtime-reachable | 141 | 78 | 4 | 1 |  |  |
| `web/src/components/factory/cards/index.ts` | runtime-reachable | 147 | 23 | 10 | 8 |  |  |
| `web/src/components/factory/cards/types.ts` | runtime-reachable | 139 | 109 | 6 | 1 |  |  |
| `web/src/components/factory/documents/DocumentLibrary.tsx` | runtime-reachable | 125 | 113 | 2 | 4 |  |  |
| `web/src/components/factory/documents/documents.css` | runtime-reachable | 113 | 227 | 3 | 0 |  |  |
| `web/src/components/factory/documents/wordExport.ts` | runtime-reachable | 124 | 59 | 1 | 0 |  |  |
| `web/src/components/factory/gallery/CampaignAnchor.tsx` | runtime-reachable | 150 | 156 | 2 | 5 |  |  |
| `web/src/components/factory/gallery/CampaignColumn.tsx` | runtime-reachable | 154 | 113 | 2 | 9 |  |  |
| `web/src/components/factory/gallery/ConnectorLayer.tsx` | runtime-reachable | 151 | 137 | 2 | 4 |  |  |
| `web/src/components/factory/gallery/FactoryGallery.tsx` | runtime-reachable | 157 | 73 | 2 | 6 |  |  |
| `web/src/components/factory/gallery/FactoryLedger.tsx` | runtime-reachable | 155 | 78 | 2 | 3 |  |  |
| `web/src/components/factory/gallery/GalleryLive.tsx` | runtime-reachable | 159 | 171 | 1 | 6 |  |  |
| `web/src/components/factory/gallery/JudgementCard.tsx` | runtime-reachable | 160 | 98 | 1 | 3 |  |  |
| `web/src/components/factory/gallery/PublishedBriefStack.tsx` | runtime-reachable | 152 | 51 | 2 | 4 |  |  |
| `web/src/components/factory/gallery/batchStorage.ts` | runtime-reachable | 158 | 63 | 2 | 0 |  |  |
| `web/src/components/factory/gallery/gallery.module.css` | runtime-reachable | 148 | 318 | 6 | 0 |  |  |
| `web/src/components/factory/gallery/index.ts` | runtime-reachable | 162 | 30 | 5 | 13 |  |  |
| `web/src/components/factory/gallery/presentation.ts` | runtime-reachable | 161 | 33 | 1 | 1 |  |  |
| `web/src/components/factory/gallery/receiptModel.ts` | runtime-reachable | 153 | 83 | 2 | 3 |  |  |
| `web/src/components/factory/gallery/useFloorFollow.ts` | runtime-reachable | 156 | 134 | 2 | 0 |  |  |
| `web/src/components/factory/gallery/viewModel.ts` | runtime-reachable | 149 | 125 | 7 | 2 |  |  |
| `web/src/components/factory/judgement/YourJudgementCard.tsx` | runtime-reachable | 117 | 253 | 3 | 3 |  |  |
| `web/src/components/factory/judgement/judgement.css` | runtime-reachable | 116 | 164 | 1 | 0 |  |  |
| `web/src/components/factory/receipts/BatchReceipt.tsx` | runtime-reachable | 131 | 126 | 1 | 2 |  |  |
| `web/src/components/factory/receipts/CampaignCompletionReceipt.tsx` | runtime-reachable | 132 | 148 | 2 | 2 |  |  |
| `web/src/components/factory/receipts/receipts.css` | runtime-reachable | 130 | 154 | 2 | 0 |  |  |
| `web/src/components/ui/accordion.tsx` | unreachable-candidate |  | 73 | 0 | 1 |  |  |
| `web/src/components/ui/badge.tsx` | unreachable-candidate |  | 53 | 0 | 1 |  |  |
| `web/src/components/ui/button.tsx` | runtime-reachable | 17 | 59 | 4 | 1 |  |  |
| `web/src/components/ui/card.tsx` | unreachable-candidate |  | 104 | 0 | 1 |  |  |
| `web/src/components/ui/input.tsx` | runtime-reachable | 18 | 21 | 4 | 1 |  |  |
| `web/src/components/ui/label.tsx` | runtime-reachable | 19 | 21 | 3 | 1 |  |  |
| `web/src/components/ui/separator.tsx` | unreachable-candidate |  | 26 | 0 | 1 |  |  |
| `web/src/components/ui/textarea.tsx` | runtime-reachable | 175 | 19 | 2 | 1 |  |  |
| `web/src/lib/anthropic.ts` | runtime-reachable | 62 | 334 | 13 | 2 |  |  |
| `web/src/lib/byok.ts` | runtime-reachable | 63 | 168 | 2 | 1 |  |  |
| `web/src/lib/client/api.ts` | runtime-reachable | 22 | 114 | 6 | 1 |  |  |
| `web/src/lib/config.ts` | runtime-reachable | 24 | 54 | 7 | 0 |  |  |
| `web/src/lib/db/client.ts` | runtime-reachable | 26 | 59 | 4 | 1 |  |  |
| `web/src/lib/db/runs.ts` | runtime-reachable | 66 | 50 | 2 | 2 |  |  |
| `web/src/lib/db/sessions.ts` | runtime-reachable | 64 | 112 | 3 | 1 |  |  |
| `web/src/lib/db/spend.ts` | runtime-reachable | 40 | 80 | 5 | 3 |  |  |
| `web/src/lib/db/ssl.ts` | runtime-reachable | 25 | 9 | 5 | 0 |  |  |
| `web/src/lib/db/wall.ts` | runtime-reachable | 27 | 67 | 5 | 1 |  |  |
| `web/src/lib/dev/sample-campaign.json` | runtime-reachable | 84 | 1360 | 2 | 0 |  |  |
| `web/src/lib/factory/agents/adjudicator.ts` | runtime-reachable | 208 | 85 | 1 | 5 |  |  |
| `web/src/lib/factory/agents/analysis.ts` | runtime-reachable | 210 | 162 | 1 | 4 |  |  |
| `web/src/lib/factory/agents/builders.ts` | runtime-reachable | 209 | 102 | 4 | 5 |  |  |
| `web/src/lib/factory/agents/delivery.ts` | runtime-reachable | 211 | 85 | 1 | 3 |  |  |
| `web/src/lib/factory/agents/index.ts` | runtime-reachable | 217 | 54 | 5 | 11 |  |  |
| `web/src/lib/factory/agents/producers.ts` | runtime-reachable | 212 | 40 | 1 | 2 |  |  |
| `web/src/lib/factory/agents/research-director.ts` | runtime-reachable | 213 | 158 | 1 | 5 |  |  |
| `web/src/lib/factory/agents/reviewer.ts` | runtime-reachable | 214 | 144 | 1 | 4 |  |  |
| `web/src/lib/factory/agents/schema.ts` | runtime-reachable | 205 | 123 | 11 | 0 |  |  |
| `web/src/lib/factory/agents/shared.ts` | runtime-reachable | 207 | 494 | 10 | 9 |  |  |
| `web/src/lib/factory/agents/specialists.ts` | runtime-reachable | 215 | 69 | 1 | 4 |  |  |
| `web/src/lib/factory/agents/strategy.ts` | runtime-reachable | 216 | 48 | 1 | 3 |  |  |
| `web/src/lib/factory/agents/types.ts` | runtime-reachable | 206 | 37 | 7 | 3 |  |  |
| `web/src/lib/factory/client/api.ts` | runtime-reachable | 176 | 65 | 1 | 1 |  |  |
| `web/src/lib/factory/client/compiled.ts` | runtime-reachable | 107 | 39 | 1 | 1 |  |  |
| `web/src/lib/factory/client/fixtures.ts` | runtime-reachable | 165 | 878 | 1 | 1 |  |  |
| `web/src/lib/factory/client/fold.ts` | runtime-reachable | 108 | 718 | 7 | 1 |  |  |
| `web/src/lib/factory/client/index.ts` | runtime-reachable | 111 | 10 | 12 | 4 |  |  |
| `web/src/lib/factory/client/storage.ts` | runtime-reachable | 109 | 61 | 1 | 0 |  |  |
| `web/src/lib/factory/client/useFactoryRun.ts` | runtime-reachable | 110 | 339 | 1 | 2 |  |  |
| `web/src/lib/factory/contracts/api.ts` | runtime-reachable | 30 | 132 | 11 | 1 |  |  |
| `web/src/lib/factory/contracts/core.ts` | runtime-reachable | 29 | 117 | 28 | 0 |  |  |
| `web/src/lib/factory/contracts/documents.ts` | runtime-reachable | 44 | 53 | 9 | 0 |  |  |
| `web/src/lib/factory/contracts/envelope.ts` | runtime-reachable | 101 | 65 | 7 | 4 |  |  |
| `web/src/lib/factory/contracts/evidence.ts` | runtime-reachable | 45 | 88 | 12 | 2 |  |  |
| `web/src/lib/factory/contracts/index.ts` | runtime-reachable | 103 | 21 | 37 | 10 |  |  |
| `web/src/lib/factory/contracts/journey.ts` | runtime-reachable | 35 | 49 | 16 | 0 |  |  |
| `web/src/lib/factory/contracts/limits.ts` | runtime-reachable | 87 | 89 | 10 | 1 |  |  |
| `web/src/lib/factory/contracts/roster.ts` | runtime-reachable | 100 | 401 | 16 | 0 |  |  |
| `web/src/lib/factory/contracts/state.ts` | runtime-reachable | 46 | 131 | 18 | 4 |  |  |
| `web/src/lib/factory/contracts/tables.ts` | runtime-reachable | 102 | 31 | 4 | 0 |  |  |
| `web/src/lib/factory/documents/compile.ts` | runtime-reachable | 50 | 493 | 4 | 7 |  |  |
| `web/src/lib/factory/documents/dev-check.ts` | support-only | 20 | 361 | 0 | 7 | test/script/check convention |  |
| `web/src/lib/factory/documents/evidence.ts` | runtime-reachable | 49 | 285 | 3 | 6 |  |  |
| `web/src/lib/factory/documents/fixtures.ts` | runtime-reachable | 133 | 445 | 3 | 4 |  |  |
| `web/src/lib/factory/documents/index.ts` | runtime-reachable | 52 | 72 | 15 | 5 |  |  |
| `web/src/lib/factory/documents/language.ts` | runtime-reachable | 47 | 269 | 5 | 4 |  |  |
| `web/src/lib/factory/documents/receipts.ts` | runtime-reachable | 51 | 372 | 3 | 7 |  |  |
| `web/src/lib/factory/documents/render.ts` | runtime-reachable | 48 | 804 | 3 | 2 |  |  |
| `web/src/lib/factory/env-identity.ts` | runtime-reachable | 229 | 57 | 1 | 1 |  |  |
| `web/src/lib/factory/ids.ts` | runtime-reachable | 34 | 14 | 5 | 0 |  |  |
| `web/src/lib/factory/ledger/index.ts` | runtime-reachable | 90 | 5 | 1 | 1 |  |  |
| `web/src/lib/factory/ledger/metrics.ts` | runtime-reachable | 89 | 367 | 1 | 6 |  |  |
| `web/src/lib/factory/replay/index.ts` | runtime-reachable | 181 | 8 | 2 | 2 |  |  |
| `web/src/lib/factory/replay/manifest.ts` | runtime-reachable | 179 | 129 | 1 | 2 |  |  |
| `web/src/lib/factory/replay/player.ts` | runtime-reachable | 180 | 430 | 2 | 1 |  |  |
| `web/src/lib/factory/replay/useReplayPlayer.ts` | runtime-reachable | 182 | 163 | 1 | 2 |  |  |
| `web/src/lib/factory/state/index.ts` | unreachable-candidate |  | 4 | 0 | 2 |  |  |
| `web/src/lib/factory/state/reducer.ts` | runtime-reachable | 55 | 268 | 3 | 5 |  |  |
| `web/src/lib/factory/state/sections.ts` | runtime-reachable | 54 | 242 | 5 | 1 |  |  |
| `web/src/lib/factory/store/agent-runs.ts` | runtime-reachable | 91 | 116 | 2 | 2 |  |  |
| `web/src/lib/factory/store/artefacts.ts` | runtime-reachable | 92 | 91 | 1 | 2 |  |  |
| `web/src/lib/factory/store/client.ts` | runtime-reachable | 93 | 28 | 3 | 2 |  |  |
| `web/src/lib/factory/store/documents.ts` | runtime-reachable | 94 | 68 | 2 | 4 |  |  |
| `web/src/lib/factory/store/events.ts` | runtime-reachable | 37 | 120 | 4 | 2 |  |  |
| `web/src/lib/factory/store/evidence.ts` | runtime-reachable | 53 | 219 | 6 | 4 |  |  |
| `web/src/lib/factory/store/index.ts` | runtime-reachable | 98 | 20 | 2 | 13 |  |  |
| `web/src/lib/factory/store/judgements.ts` | runtime-reachable | 95 | 84 | 2 | 3 |  |  |
| `web/src/lib/factory/store/ledger.ts` | runtime-reachable | 88 | 72 | 3 | 2 |  |  |
| `web/src/lib/factory/store/proposals.ts` | runtime-reachable | 96 | 162 | 2 | 3 |  |  |
| `web/src/lib/factory/store/replay.ts` | runtime-reachable | 97 | 95 | 3 | 2 |  |  |
| `web/src/lib/factory/store/runs.ts` | runtime-reachable | 38 | 344 | 10 | 5 |  |  |
| `web/src/lib/factory/store/state-versions.ts` | runtime-reachable | 56 | 67 | 7 | 5 |  |  |
| `web/src/lib/factory/store/types.ts` | runtime-reachable | 36 | 39 | 16 | 0 |  |  |
| `web/src/lib/jobs/store.ts` | runtime-reachable | 76 | 69 | 2 | 3 |  |  |
| `web/src/lib/pipeline/geo.ts` | runtime-reachable | 67 | 43 | 1 | 1 |  |  |
| `web/src/lib/pipeline/labels.ts` | runtime-reachable | 20 | 26 | 18 | 0 |  |  |
| `web/src/lib/pipeline/lint.ts` | runtime-reachable | 70 | 45 | 1 | 6 |  |  |
| `web/src/lib/pipeline/models.ts` | runtime-reachable | 60 | 28 | 6 | 0 |  |  |
| `web/src/lib/pipeline/prompts.ts` | runtime-reachable | 68 | 72 | 4 | 1 |  |  |
| `web/src/lib/pipeline/run.ts` | runtime-reachable | 75 | 169 | 1 | 9 |  |  |
| `web/src/lib/pipeline/schemas.ts` | runtime-reachable | 69 | 162 | 3 | 1 |  |  |
| `web/src/lib/pipeline/stageA.ts` | runtime-reachable | 71 | 75 | 1 | 6 |  |  |
| `web/src/lib/pipeline/stageB.ts` | runtime-reachable | 73 | 51 | 1 | 8 |  |  |
| `web/src/lib/pipeline/stageC.ts` | runtime-reachable | 74 | 71 | 1 | 7 |  |  |
| `web/src/lib/pipeline/types.ts` | runtime-reachable | 21 | 278 | 15 | 1 |  |  |
| `web/src/lib/pipeline/util.ts` | runtime-reachable | 72 | 18 | 3 | 1 |  |  |
| `web/src/lib/session.ts` | runtime-reachable | 31 | 30 | 7 | 0 |  |  |
| `web/src/lib/spend/pricing.ts` | runtime-reachable | 61 | 45 | 8 | 0 |  |  |
| `web/src/lib/utils.ts` | runtime-reachable | 16 | 7 | 8 | 0 |  |  |
| `web/tests/factory/batch.spec.ts` | support-only | 25 | 297 | 0 | 1 | test/script/check convention |  |
| `web/tests/factory/factory.helpers.ts` | support-only | 24 | 188 | 2 | 2 | test/script/check convention |  |
| `web/tests/factory/public.spec.ts` | support-only | 26 | 61 | 0 | 1 | test/script/check convention |  |
| `worker/src/__checks__/barrel-load.ts` | support-only | 46 | 7 | 0 | 1 | test/script/check convention |  |
| `worker/src/__checks__/byok-roundtrip.ts` | support-only | 51 | 17 | 0 | 1 | test/script/check convention |  |
| `worker/src/__checks__/openrouter-passthrough.ts` | support-only | 52 | 76 | 0 | 1 | test/script/check convention | `../../../app/.env` |
| `worker/src/__checks__/openrouter-routing.ts` | support-only | 53 | 15 | 0 | 1 | test/script/check convention |  |
| `worker/src/agents/__checks__/gateway-and-labels.ts` | support-only | 78 | 238 | 0 | 11 | test/script/check convention |  |
| `worker/src/agents/__checks__/live-probe.ts` | support-only | 79 | 126 | 0 | 5 | test/script/check convention | `../../../../web/.env.local` |
| `worker/src/agents/deps.ts` | runtime-reachable | 204 | 88 | 16 | 2 |  |  |
| `worker/src/agents/executor.ts` | runtime-reachable | 224 | 382 | 3 | 11 |  |  |
| `worker/src/agents/gateway.ts` | runtime-reachable | 218 | 474 | 4 | 4 |  |  |
| `worker/src/agents/index.ts` | runtime-reachable | 226 | 21 | 0 | 6 | explicit entry |  |
| `worker/src/agents/mock.ts` | runtime-reachable | 223 | 491 | 2 | 5 |  |  |
| `worker/src/agents/model-call.ts` | runtime-reachable | 220 | 424 | 2 | 8 |  |  |
| `worker/src/agents/model-errors.ts` | runtime-reachable | 221 | 48 | 2 | 0 |  |  |
| `worker/src/agents/qa.ts` | runtime-reachable | 225 | 204 | 2 | 5 |  |  |
| `worker/src/agents/reviewer.ts` | runtime-reachable | 222 | 259 | 3 | 10 |  |  |
| `worker/src/agents/work.ts` | runtime-reachable | 219 | 70 | 5 | 1 |  |  |
| `worker/src/byok.ts` | runtime-reachable | 235 | 100 | 3 | 2 |  |  |
| `worker/src/config.ts` | runtime-reachable | 227 | 122 | 10 | 2 |  |  |
| `worker/src/cost.ts` | runtime-reachable | 241 | 56 | 1 | 3 |  |  |
| `worker/src/db/pool.ts` | runtime-reachable | 228 | 34 | 12 | 1 |  |  |
| `worker/src/events/emit.ts` | runtime-reachable | 236 | 97 | 2 | 4 |  |  |
| `worker/src/events/hub.ts` | runtime-reachable | 231 | 103 | 3 | 2 |  |  |
| `worker/src/gate.ts` | runtime-reachable | 237 | 147 | 2 | 1 |  |  |
| `worker/src/graph/build.ts` | runtime-reachable | 243 | 99 | 1 | 4 |  |  |
| `worker/src/graph/checkpointer.ts` | runtime-reachable | 232 | 38 | 2 | 2 |  |  |
| `worker/src/graph/context.ts` | runtime-reachable | 238 | 72 | 4 | 7 |  |  |
| `worker/src/graph/executor-loader.ts` | runtime-reachable | 234 | 262 | 2 | 6 |  |  |
| `worker/src/graph/finalise.ts` | runtime-reachable | 240 | 139 | 1 | 6 |  |  |
| `worker/src/graph/nodes.ts` | runtime-reachable | 242 | 922 | 1 | 11 |  |  |
| `worker/src/graph/review-contract.ts` | runtime-reachable | 233 | 52 | 3 | 4 |  |  |
| `worker/src/graph/run.ts` | runtime-reachable | 246 | 257 | 1 | 19 |  |  |
| `worker/src/graph/state.ts` | runtime-reachable | 239 | 61 | 4 | 3 |  |  |
| `worker/src/http/handlers.ts` | runtime-reachable | 248 | 273 | 1 | 11 |  |  |
| `worker/src/http/server.ts` | runtime-reachable | 250 | 199 | 1 | 5 |  |  |
| `worker/src/http/signing.ts` | runtime-reachable | 247 | 82 | 2 | 1 |  |  |
| `worker/src/http/sse.ts` | runtime-reachable | 249 | 95 | 1 | 5 |  |  |
| `worker/src/index.ts` | runtime-reachable | 253 | 81 | 0 | 11 | explicit entry; package script: dev; package script: start |  |
| `worker/src/migrate.ts` | runtime-reachable | 251 | 142 | 1 | 1 | explicit entry; package script: migrate |  |
| `worker/src/queue/boss.ts` | runtime-reachable | 244 | 186 | 4 | 5 |  |  |
| `worker/src/runtime/recover.ts` | runtime-reachable | 252 | 63 | 1 | 2 |  |  |
| `worker/src/runtime/registry.ts` | runtime-reachable | 245 | 37 | 2 | 0 |  |  |
| `worker/src/store/index.ts` | runtime-reachable | 230 | 56 | 11 | 15 |  |  |
