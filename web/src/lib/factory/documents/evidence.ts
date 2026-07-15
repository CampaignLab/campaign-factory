// "Evidence and Next Checks" (ADR 0006). Builds the structured source ledger
// (claims grouped by the seven verification labels), unresolved conflicts, the
// next-checks list with affected sections, and terminal gaps — plus the HTML
// section that appears at the foot of the Campaign Brief. PURE, runtime-neutral.
//
// Nothing is invented: missing evidence surfaces as explicit unresolved / gap
// entries, never as silent completion.

import type { CampaignState, TerminalGap } from "../contracts/state";
import type { Claim, NextCheck } from "../contracts/evidence";
import { VERIFICATION_LABELS, type VerificationLabel } from "../../pipeline/labels";
import {
  blocksToHtml,
  blocksToText,
  escapeHtml,
  isUnresolvedLabel,
  withVerifyHtml,
  type Block,
} from "./render";

export interface EvidenceClaimView {
  id: string;
  text: string;
  type: string;
  label: VerificationLabel;
  loadBearing: boolean;
  confidence: string;
  excerpt?: string;
  sourceCount: number;
  affectedOutputs: string[];
  contradictsClaimIds?: string[];
}

export interface SourceLedgerGroup {
  label: VerificationLabel;
  count: number;
  claims: EvidenceClaimView[];
}

export interface EvidenceTotals {
  claims: number;
  loadBearing: number;
  verifiedLoadBearing: number; // load-bearing claims that reached a settled label
  unresolvedLoadBearing: number;
}

export interface EvidenceAndNextChecks {
  groups: SourceLedgerGroup[]; // in canonical label order; only labels present
  conflicts: EvidenceClaimView[]; // "Conflicting evidence" or explicit contradiction links
  nextChecks: NextCheck[];
  terminalGaps: TerminalGap[];
  totals: EvidenceTotals;
}

function toView(claim: Claim): EvidenceClaimView {
  return {
    id: claim.id,
    text: claim.text,
    type: claim.type,
    label: claim.status,
    loadBearing: claim.loadBearing,
    confidence: claim.confidence,
    excerpt: claim.excerpt,
    sourceCount: claim.sourceIds?.length ?? 0,
    affectedOutputs: claim.affectedOutputs ?? [],
    contradictsClaimIds: claim.contradictsClaimIds,
  };
}

export function buildEvidenceAndNextChecks(state: CampaignState, claims: Claim[]): EvidenceAndNextChecks {
  const views = claims.map(toView);

  const groups: SourceLedgerGroup[] = [];
  for (const label of VERIFICATION_LABELS) {
    const inGroup = views.filter((v) => v.label === label);
    if (inGroup.length) groups.push({ label, count: inGroup.length, claims: inGroup });
  }

  const conflicts = views.filter(
    (v) => v.label === "Conflicting evidence" || (v.contradictsClaimIds?.length ?? 0) > 0,
  );

  const loadBearing = views.filter((v) => v.loadBearing);
  const unresolvedLoadBearing = loadBearing.filter((v) => isUnresolvedLabel(v.label));

  return {
    groups,
    conflicts,
    nextChecks: state.nextChecks ?? [],
    terminalGaps: state.terminalGaps ?? [],
    totals: {
      claims: views.length,
      loadBearing: loadBearing.length,
      verifiedLoadBearing: loadBearing.length - unresolvedLoadBearing.length,
      unresolvedLoadBearing: unresolvedLoadBearing.length,
    },
  };
}

/** The Campaign Brief's closing section, rendered as html + plain text. */
export function evidenceSection(data: EvidenceAndNextChecks): { html: string; plainText: string } {
  const blocks: Block[] = [];
  blocks.push({ t: "h2", text: "Evidence and next checks" });

  const t = data.totals;
  blocks.push({
    t: "p",
    text:
      `${t.claims} claim${t.claims === 1 ? "" : "s"} labelled · ` +
      `${t.loadBearing} load-bearing (${t.verifiedLoadBearing} settled, ${t.unresolvedLoadBearing} unresolved). ` +
      `Every factual claim carries one of the seven verification labels; unresolved items are shown, not filled in.`,
  });

  // We render the ledger groups and gap/check lists with a little more structure
  // than the block AST offers (label tags, per-claim excerpts), so build the
  // inner html directly and append it. Plain text is produced from blocks + a
  // parallel text builder.
  const html: string[] = [blocksToHtml(blocks)];
  const text: string[] = [blocksToText(blocks)];

  // ---- source ledger by label ----
  html.push(`<h3>Source ledger</h3>`);
  text.push("Source ledger");
  if (!data.groups.length) {
    html.push(`<p class="fa-doc-note">No claims recorded yet.</p>`);
    text.push("(No claims recorded yet.)");
  }
  for (const g of data.groups) {
    html.push(
      `<h4>${escapeHtml(g.label)} <span class="tag ${labelClass(g.label)}">${g.count}</span></h4>`,
    );
    text.push(`${g.label} (${g.count})`);
    const items = g.claims.map((c) => {
      const meta: string[] = [];
      if (c.loadBearing) meta.push("load-bearing");
      if (c.sourceCount) meta.push(`${c.sourceCount} source${c.sourceCount === 1 ? "" : "s"}`);
      if (c.confidence) meta.push(`confidence ${c.confidence}`);
      const excerpt = c.excerpt ? ` <span class="src-ev">“${escapeHtml(c.excerpt)}”</span>` : "";
      const metaHtml = meta.length ? ` <span class="hint-sm">(${escapeHtml(meta.join(" · "))})</span>` : "";
      return { html: `${withVerifyHtml(c.text)}${metaHtml}${excerpt}`, text: `- ${c.text}${meta.length ? ` (${meta.join(" · ")})` : ""}` };
    });
    html.push(`<ul>${items.map((i) => `<li>${i.html}</li>`).join("")}</ul>`);
    for (const i of items) text.push(i.text);
  }

  // ---- unresolved conflicts ----
  if (data.conflicts.length) {
    html.push(`<h3>Unresolved conflicts</h3>`);
    text.push("Unresolved conflicts");
    html.push(
      `<ul>${data.conflicts
        .map((c) => `<li>${withVerifyHtml(c.text)} ${tag("Conflicting evidence")}</li>`)
        .join("")}</ul>`,
    );
    for (const c of data.conflicts) text.push(`- ${c.text} [Conflicting evidence]`);
  }

  // ---- next checks ----
  if (data.nextChecks.length) {
    html.push(`<h3>Next checks</h3>`);
    text.push("Next checks");
    const rows = data.nextChecks.map((n) => {
      const affects = n.affectedSections?.length ? ` — affects: ${n.affectedSections.join(", ")}` : "";
      const reason = n.reason ? ` (${n.reason})` : "";
      return {
        html: `<li><b>${escapeHtml(n.description)}</b>${escapeHtml(reason)}${escapeHtml(affects)}</li>`,
        text: `- ${n.description}${reason}${affects}`,
      };
    });
    html.push(`<ul>${rows.map((r) => r.html).join("")}</ul>`);
    for (const r of rows) text.push(r.text);
  }

  // ---- terminal gaps ----
  if (data.terminalGaps.length) {
    html.push(`<h3>Terminal gaps</h3>`);
    html.push(
      `<p class="fa-doc-note">Work that could not be completed. Nothing was invented to cover these.</p>`,
    );
    text.push("Terminal gaps (work that could not be completed — nothing invented to cover these):");
    html.push(
      `<ul>${data.terminalGaps
        .map((gp) => `<li>${escapeHtml(gp.description)}${gp.step ? ` <span class="hint-sm">(step ${gp.step})</span>` : ""}</li>`)
        .join("")}</ul>`,
    );
    for (const gp of data.terminalGaps) text.push(`- ${gp.description}${gp.step ? ` (step ${gp.step})` : ""}`);
  }

  return { html: html.join("\n"), plainText: text.join("\n\n").trim() };
}

// local label-class helpers (kept here to avoid importing the tag() html builder
// where a bare class name is needed)
function labelClass(label: VerificationLabel): string {
  const map: Record<VerificationLabel, string> = {
    "Verified public information": "real",
    "Supported inference": "gen",
    "Generated campaign recommendation": "gen",
    "Campaign assumption": "mock",
    "Conflicting evidence": "verify",
    "Verification incomplete": "verify",
    "External information unavailable": "ext",
  };
  return map[label];
}
function tag(label: VerificationLabel): string {
  return `<span class="tag ${labelClass(label)}">${escapeHtml(label)}</span>`;
}
