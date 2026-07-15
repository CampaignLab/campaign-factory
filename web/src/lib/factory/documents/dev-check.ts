// Standalone check: exercises the pure compiler + receipts against the Leicester
// fixture and prints a summary. Not part of the app build. Run via the project's
// TypeScript compiler into a temp dir, then node (see the run notes in the W6
// handoff). Uses only runtime-neutral modules (no next/*, no DOM).

import type { CampaignState } from "../contracts/state";
import type { Claim } from "../contracts/evidence";
import { compileDocuments, isExportable } from "./compile";
import { buildEvidenceAndNextChecks } from "./evidence";
import { buildCampaignReceipt, buildBatchReceipt } from "./receipts";
import { FIXTURE_CAMPAIGN_ID, FIXTURE_STATE, FIXTURE_CLAIMS, FIXTURE_EVENTS } from "./fixtures";

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failures += 1;
    console.error(`  ✗ ${msg}`);
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

console.log("=== compileDocuments ===");
const docs = compileDocuments(FIXTURE_STATE, FIXTURE_CLAIMS);
assert(docs.length === 9, `compiles all nine documents (got ${docs.length})`);
for (const d of docs) {
  console.log(
    `  #${d.num} ${d.name} → ${d.status}` +
      `${d.isPack ? ` [pack, ${d.resourceCount} resource(s)]` : ""}` +
      `${d.flags.length ? ` (${d.flags.length} flag(s))` : ""}` +
      ` · html ${d.html.length}b · text ${d.plainText.length}b`,
  );
  assert(d.html.length > 0, `${d.key} has html`);
  assert(d.plainText.length > 0, `${d.key} has plainText`);
  assert(
    ["assembling", "under review", "ready", "needs verification"].includes(d.status),
    `${d.key} status is an exact product string`,
  );
}

const byKey = new Map(docs.map((d) => [d.key, d]));
assert(byKey.get("objective_theory_of_change")!.status === "ready", "objective doc ready (accepted section, no unresolved claims)");
assert(byKey.get("power_stakeholder_map")!.status === "needs verification", "power map needs verification (pressure flagged + conflicting claim)");
assert(byKey.get("campaign_strategy")!.status === "ready", "strategy ready");
assert(byKey.get("tactics_timeline")!.status === "ready", "tactics ready");
assert(
  byKey.get("organising_plan")!.status === "assembling",
  "organising assembling (section empty — c7's unresolved claim must NOT flip a contentless doc to needs verification)",
);
assert(byKey.get("campaign_brief")!.status === "needs verification", "brief needs verification (pressure flagged)");
assert(byKey.get("lobbying_pack")!.status === "needs verification", "lobbying pack needs verification (has verification note)");
assert(byKey.get("media_pack")!.status === "ready", "media pack ready (clean resources)");
assert(byKey.get("digital_pack")!.status === "assembling", "digital pack assembling (no resources)");

const readyCount = docs.filter((d) => d.status === "ready").length;
assert(readyCount === 4, `4 documents ready (got ${readyCount})`);

// contentless documents are never exportable
assert(!isExportable(byKey.get("organising_plan")!.status), "contentless organising plan is not exportable");
assert(!isExportable(byKey.get("digital_pack")!.status), "contentless digital pack is not exportable");

// no invented completion: the brief must explicitly mark the empty organising section
assert(
  byKey.get("campaign_brief")!.plainText.includes("Not yet reviewer-accepted"),
  "brief explicitly marks unaccepted sections (no invented completion)",
);
assert(
  byKey.get("digital_pack")!.plainText.toLowerCase().includes("no resources"),
  "empty pack honestly states no resources",
);

// step 10 derives from the compiled document statuses — no phantom
// "Not yet reviewer-accepted" section (only decision_route + organising qualify)
const briefText = byKey.get("campaign_brief")!.plainText;
const unacceptedMarks = briefText.split("Not yet reviewer-accepted").length - 1;
assert(
  unacceptedMarks === 2,
  `brief marks exactly the 2 unaccepted sections, no phantom step 10 (got ${unacceptedMarks})`,
);
assert(
  briefText.includes("2. Objective and Theory of Change: ready"),
  "brief step 10 summarises the nine documents and their statuses",
);

// extras fallback: reviewer-accepted content beyond the bespoke keys still renders
assert(briefText.includes("Local government"), "brief renders the specialist lane block (humanised lane_ key)");
assert(
  briefText.includes("administered by the Highways team"),
  "brief renders the lane findings content, not a 'no structured content' note",
);
assert(
  byKey.get("objective_theory_of_change")!.plainText.includes("Theory of change"),
  "objective doc renders the preserved theoryOfChange field",
);

console.log("\n=== affectedOutputs normalization ===");
const variantClaim: Claim = {
  id: "cv1",
  campaignId: FIXTURE_CAMPAIGN_ID,
  text: "The spring 2027 term deadline is not confirmed by any council source.",
  type: "deadline",
  status: "Verification incomplete",
  loadBearing: true,
  confidence: "low",
  sourceIds: [],
  authorAgentRunId: "ar2",
  stateVersion: 6,
  affectedOutputs: ["Objective and Theory of Change"], // free text, not a key
};
const docsWithVariant = compileDocuments(FIXTURE_STATE, [...FIXTURE_CLAIMS, variantClaim]);
const objWithVariant = docsWithVariant.find((d) => d.key === "objective_theory_of_change")!;
assert(
  objWithVariant.status === "needs verification",
  `free-text affectedOutputs variant still reaches its document (got ${objWithVariant.status})`,
);

console.log("\n=== contentless pack with stored terminal status ===");
const stateWithEmptyReadyPack: CampaignState = {
  ...FIXTURE_STATE,
  documents: FIXTURE_STATE.documents.map((d) =>
    d.key === "digital_pack" ? { ...d, status: "ready" as const } : d,
  ),
};
const emptyReadyDocs = compileDocuments(stateWithEmptyReadyPack, FIXTURE_CLAIMS);
const emptyReadyPack = emptyReadyDocs.find((d) => d.key === "digital_pack")!;
assert(
  emptyReadyPack.status === "assembling",
  `stored terminal status on an empty pack compiles to assembling (got ${emptyReadyPack.status})`,
);

console.log("\n=== buildEvidenceAndNextChecks ===");
const evidence = buildEvidenceAndNextChecks(FIXTURE_STATE, FIXTURE_CLAIMS);
console.log(`  groups: ${evidence.groups.map((g) => `${g.label}(${g.count})`).join(", ")}`);
console.log(`  conflicts: ${evidence.conflicts.length}, nextChecks: ${evidence.nextChecks.length}, terminalGaps: ${evidence.terminalGaps.length}`);
console.log(`  totals: ${JSON.stringify(evidence.totals)}`);
assert(evidence.totals.claims === 7, "7 claims total");
assert(evidence.totals.loadBearing === 5, "5 load-bearing claims");
assert(evidence.totals.unresolvedLoadBearing === 3, "3 unresolved load-bearing claims (c2, c3, c7)");
assert(evidence.conflicts.length === 1, "1 conflict surfaced");
assert(evidence.groups.length === 5, "claims grouped across 5 labels");

console.log("\n=== buildCampaignReceipt (events + state + claims) ===");
const receipt = buildCampaignReceipt(FIXTURE_EVENTS, FIXTURE_STATE, FIXTURE_CLAIMS);
console.log(`  status: ${receipt.status} (partial=${receipt.partial})`);
console.log(`  agents: ${JSON.stringify(receipt.agents)}`);
console.log(`  sourcesFetched: ${receipt.sourcesFetched}`);
console.log(`  sections: ${receipt.sections.accepted}/${receipt.sections.total}`);
console.log(`  documents ready: ${receipt.documents.ready}/${receipt.documents.total} (needsVerification ${receipt.documents.needsVerification})`);
console.log(`  terminalGaps: ${receipt.terminalGaps}`);
console.log(`  judgements: ${JSON.stringify(receipt.judgements)}`);
console.log(`  claims: ${JSON.stringify(receipt.claims)}`);
console.log(`  elapsedMs: ${receipt.elapsedMs}`);
assert(receipt.status === "partial", "run status is partial (last run.* event)");
assert(receipt.agents.spawned === 7, `7 agents spawned (got ${receipt.agents.spawned})`);
assert(receipt.agents.completed === 6, `6 agents completed (got ${receipt.agents.completed})`);
assert(receipt.agents.failed === 1, `1 agent failed (got ${receipt.agents.failed})`);
assert(receipt.sourcesFetched === 3, `3 sources fetched (got ${receipt.sourcesFetched})`);
assert(receipt.sections.accepted === 6, `6 sections accepted (got ${receipt.sections.accepted})`);
assert(
  receipt.sections.total === 9,
  `9 acceptable sections — step 10 is compiled, never reviewer-accepted (got ${receipt.sections.total})`,
);
assert(receipt.documents.ready === 4, `4 documents ready (got ${receipt.documents.ready})`);
assert(receipt.terminalGaps === 1, "1 terminal gap");
assert(receipt.judgements.requested === 1 && receipt.judgements.resolved === 1, "1 judgement requested + resolved");
assert(receipt.claims.total === 7 && receipt.claims.labelSource === "claim-ledger", "claim tally from ledger");
assert(typeof receipt.elapsedMs === "number" && receipt.elapsedMs! > 0, "elapsed derived from events");

console.log("\n=== buildCampaignReceipt (events + state only, no claim ledger) ===");
const receiptNoClaims = buildCampaignReceipt(FIXTURE_EVENTS, FIXTURE_STATE);
console.log(`  claims: ${JSON.stringify(receiptNoClaims.claims)}`);
assert(receiptNoClaims.claims.labelSource === "events", "falls back to event-derived labels without a ledger");
assert(receiptNoClaims.claims.byLabel["Verified public information"] === 2, "2 verified claims from events (c1, c6)");

console.log("\n=== buildBatchReceipt ===");
const batch = buildBatchReceipt(
  [
    { events: FIXTURE_EVENTS, state: FIXTURE_STATE, claims: FIXTURE_CLAIMS },
    { events: FIXTURE_EVENTS, state: FIXTURE_STATE, claims: FIXTURE_CLAIMS },
  ],
  { batchId: "fixture-batch" },
);
console.log(`  campaignCount: ${batch.campaignCount}`);
console.log(`  totals: ${JSON.stringify(batch.totals)}`);
console.log(`  statuses: ${JSON.stringify(batch.statuses)}`);
console.log(`  substantiallyUsable: ${batch.substantiallyUsable}`);
assert(batch.campaignCount === 2, "2 campaigns in batch");
assert(batch.totals.documentsReady === 8, "batch totals ready docs across campaigns (4+4)");
assert(batch.substantiallyUsable === 2, "both campaigns substantially usable (≥1 ready doc)");
assert(batch.statuses.partial === 2, "both campaigns partial in batch status roll-up");

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
if (failures > 0) process.exit(1);
