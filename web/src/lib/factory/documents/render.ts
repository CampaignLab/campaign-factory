// Deterministic HTML/plain-text rendering for the nine Canonical Campaign
// Documents (ADR 0007). PURE and runtime-neutral: no next/*, no DOM, no
// randomness, no Date.now(). Same input → same output. The compiler is the ONLY
// renderer; agents never rewrite shared factual foundations at export.
//
// A tiny block AST is rendered to BOTH html and plainText from one source, so
// the on-page view, the Copy action, and the Word .doc download all stay in
// sync. Verification labels render inline as `.tag` spans (the seven-label
// vocabulary from the pipeline integrity spine); `[VERIFY: …]` / `[ … ]`
// placeholders are highlighted, never silently dropped.

import type { JourneyStepKey } from "../contracts/journey";
import { isVerificationLabel, type VerificationLabel } from "../../pipeline/labels";

/* label → provenance tag class (identical mapping to Journey.tsx / journey.css) */
export const LABEL_TAG_CLASS: Record<VerificationLabel, string> = {
  "Verified public information": "real",
  "Supported inference": "gen",
  "Generated campaign recommendation": "gen",
  "Campaign assumption": "mock",
  "Conflicting evidence": "verify",
  "Verification incomplete": "verify",
  "External information unavailable": "ext",
};

/** Labels that mean a claim is NOT settled — used by the document status logic. */
export const UNRESOLVED_LABELS: ReadonlySet<VerificationLabel> = new Set<VerificationLabel>([
  "Conflicting evidence",
  "Verification incomplete",
  "External information unavailable",
]);

export function isUnresolvedLabel(label: VerificationLabel): boolean {
  return UNRESOLVED_LABELS.has(label);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap every `[ … ]` placeholder in a <mark> (VERIFY items + fill-in blanks
 *  alike) so nothing unresolved slips through unmarked — mirrors Journey. */
export function withVerifyHtml(text: string): string {
  return text
    .split(/(\[[^\]\n]+\])/g)
    .map((p) =>
      /^\[[^\]\n]+\]$/.test(p)
        ? `<mark${/^\[verify\b/i.test(p) ? ' class="ph-verify"' : ""}>${escapeHtml(p)}</mark>`
        : escapeHtml(p),
    )
    .join("");
}

export function tagHtml(label: string): string {
  const cls = isVerificationLabel(label) ? LABEL_TAG_CLASS[label] : "gen";
  return `<span class="tag ${cls}">${escapeHtml(label)}</span>`;
}

// ---- block AST ----

export type Block =
  | { t: "h2" | "h3" | "h4"; text: string; label?: string }
  | { t: "p"; text: string; label?: string; callout?: "warm" | "blue" | "mint" }
  | { t: "quote"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "kv"; rows: Array<[string, string]> }
  | { t: "note"; text: string }; // honest gap / verification marker

const CALLOUT_CLASS: Record<NonNullable<Extract<Block, { t: "p" }>["callout"]>, string> = {
  warm: "callout warm",
  blue: "callout",
  mint: "callout mint",
};

export function blocksToHtml(blocks: Block[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    switch (b.t) {
      case "h2":
      case "h3":
      case "h4": {
        const label = b.label ? ` ${tagHtml(b.label)}` : "";
        out.push(`<${b.t}>${escapeHtml(b.text)}${label}</${b.t}>`);
        break;
      }
      case "p": {
        const cls = b.callout ? ` class="${CALLOUT_CLASS[b.callout]}"` : "";
        const label = b.label ? ` ${tagHtml(b.label)}` : "";
        out.push(`<p${cls}>${withVerifyHtml(b.text)}${label}</p>`);
        break;
      }
      case "quote":
        out.push(`<blockquote class="narr">${withVerifyHtml(b.text)}</blockquote>`);
        break;
      case "ul":
      case "ol":
        if (b.items.length) {
          out.push(
            `<${b.t}>${b.items.map((i) => `<li>${withVerifyHtml(i)}</li>`).join("")}</${b.t}>`,
          );
        }
        break;
      case "kv":
        if (b.rows.length) {
          out.push(
            `<table><tbody>${b.rows
              .map(([k, v]) => `<tr><td><b>${escapeHtml(k)}</b></td><td>${withVerifyHtml(v)}</td></tr>`)
              .join("")}</tbody></table>`,
          );
        }
        break;
      case "note":
        out.push(`<p class="fa-doc-note">${escapeHtml(b.text)}</p>`);
        break;
    }
  }
  return out.join("\n");
}

export function blocksToText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.t) {
      case "h2":
        parts.push(`\n${b.text.toUpperCase()}${b.label ? ` [${b.label}]` : ""}`);
        break;
      case "h3":
        parts.push(`${b.text}${b.label ? ` [${b.label}]` : ""}`);
        break;
      case "h4":
        parts.push(`${b.text}${b.label ? ` [${b.label}]` : ""}`);
        break;
      case "p":
        parts.push(`${b.text}${b.label ? ` [${b.label}]` : ""}`);
        break;
      case "quote":
        parts.push(b.text);
        break;
      case "ul":
        for (const i of b.items) parts.push(`- ${i}`);
        break;
      case "ol":
        b.items.forEach((i, n) => parts.push(`${n + 1}. ${i}`));
        break;
      case "kv":
        for (const [k, v] of b.rows) parts.push(`${k}: ${v}`);
        break;
      case "note":
        parts.push(`(${b.text})`);
        break;
    }
  }
  // collapse to double-newline paragraph separation, trimmed
  return parts
    .map((p) => p.trim())
    .filter((p) => p.length)
    .join("\n\n")
    .trim();
}

// ---- defensive content accessors (content is `unknown`, may be partial) ----

export function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
export function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}
export function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];
}
export function objArr(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x))
    : [];
}

// ---- per-section renderers (content shapes mirror state/sections.ts) ----

function pushList(blocks: Block[], heading: string, items: string[]): void {
  if (items.length) {
    blocks.push({ t: "h3", text: heading });
    blocks.push({ t: "ul", items });
  }
}

export function renderProblem(content: unknown): Block[] {
  const c = rec(content);
  const b: Block[] = [];
  const statement = str(c.statement);
  if (statement) b.push({ t: "quote", text: statement });
  const interpretation = str(c.interpretation);
  if (interpretation) {
    b.push({ t: "h3", text: "How the campaign was scoped", label: "Generated campaign recommendation" });
    b.push({ t: "p", text: interpretation, callout: "warm" });
  }
  const ctx = rec(c.context);
  const situation = str(ctx.situation);
  if (situation) {
    b.push({ t: "h3", text: "The situation" });
    b.push({ t: "p", text: situation });
  }
  const currentPolicy = str(ctx.currentPolicy);
  if (currentPolicy) {
    b.push({ t: "h4", text: "Current policy / restriction" });
    b.push({ t: "p", text: currentPolicy });
  }
  const howItChanged = str(ctx.howItChanged);
  if (howItChanged) {
    b.push({ t: "h4", text: "How research changed the request" });
    b.push({ t: "p", text: howItChanged, callout: "blue" });
  }
  pushList(b, "Key dates and processes", strArr(ctx.keyDates));
  pushList(b, "Institutions involved", strArr(ctx.institutions));
  pushList(b, "People affected", strArr(ctx.affected));
  return b;
}

export function renderEvidence(content: unknown): Block[] {
  const c = rec(content);
  const b: Block[] = [];
  const summary = str(c.summary);
  if (summary) b.push({ t: "p", text: summary });
  pushList(b, "Research questions", strArr(c.researchQuestions));
  pushList(b, "Key dates", strArr(c.keyDates));
  pushList(b, "Institutions", strArr(c.institutions));
  pushList(b, "Likely allies", strArr(c.allies));
  pushList(b, "Likely opponents", strArr(c.opponents));
  pushList(b, "Local media", strArr(c.localMedia));
  pushList(b, "Still unresolved", strArr(c.unresolved));
  return b;
}

export function renderObjective(content: unknown): Block[] {
  const c = rec(content);
  const b: Block[] = [];
  const dm = str(c.dm);
  const action = str(c.action);
  const by = str(c.by);
  const mvw = str(c.mvw);
  if (dm && action) {
    const by2 = by ? ` by ${by}` : "";
    const mvw2 = mvw ? `, even if the immediate outcome is only ${mvw}` : "";
    b.push({ t: "p", text: `We want ${dm} to ${action}${by2}${mvw2}.`, callout: "warm" });
  }
  const rows: Array<[string, string]> = [];
  if (dm) rows.push(["Decision-maker", dm]);
  if (action) rows.push(["Specific action", action]);
  if (by) rows.push(["By", by]);
  if (mvw) rows.push(["Minimum viable win", mvw]);
  const success = str(c.success);
  if (success) rows.push(["Success looks like", success]);
  if (rows.length) b.push({ t: "kv", rows });
  const smart = objArr(c.smart);
  if (smart.length) {
    b.push({ t: "h3", text: "SMART assessment" });
    b.push({
      t: "kv",
      rows: smart
        .map((s): [string, string] => [str(s.test) || "Test", str(s.assessment) || "—"])
        .filter(([, v]) => v),
    });
  }
  pushList(b, "Constraints", strArr(c.constraints));
  return b;
}

export function renderDecisionRoute(content: unknown): Block[] {
  const c = rec(content);
  const b: Block[] = [];
  const rows: Array<[string, string]> = [];
  const formal = str(c.formal);
  if (formal) rows.push(["Formal authority", formal]);
  const implementer = str(c.implementer);
  if (implementer) rows.push(["Implementer", implementer]);
  if (rows.length) b.push({ t: "kv", rows });
  const practical = str(c.practical);
  if (practical) {
    b.push({ t: "h3", text: "How it works in practice", label: "Supported inference" });
    b.push({ t: "p", text: practical, callout: "blue" });
  }
  pushList(b, "Processes and committees", strArr(c.processes));
  pushList(b, "Intervention points", strArr(c.interventionPoints));
  pushList(b, "Deadlines", strArr(c.deadlines));
  pushList(b, "Unresolved institutional questions", strArr(c.unresolved));
  return b;
}

const TIER_LABEL: Record<string, string> = {
  decides: "Decides",
  influences: "Influences",
  mobilises: "Mobilises",
  resists: "May resist",
  neutral: "Neutral",
};
const TIER_ORDER = ["decides", "influences", "mobilises", "resists", "neutral"];

export function renderPower(content: unknown): Block[] {
  const c = rec(content);
  const b: Block[] = [];
  const statusQuoCost = str(c.statusQuoCost);
  if (statusQuoCost) {
    b.push({ t: "h3", text: "Cost of the status quo" });
    b.push({ t: "p", text: statusQuoCost, callout: "warm" });
  }
  const stakeholders = objArr(c.stakeholders);
  const byTier = new Map<string, Record<string, unknown>[]>();
  for (const s of stakeholders) {
    const tier = str(s.tier) || "neutral";
    const bucket = byTier.get(tier);
    if (bucket) bucket.push(s);
    else byTier.set(tier, [s]);
  }
  for (const tier of TIER_ORDER) {
    const rows = byTier.get(tier);
    if (!rows || !rows.length) continue;
    b.push({ t: "h3", text: TIER_LABEL[tier] || tier });
    for (const s of rows) {
      const name = str(s.name) || str(s.role) || "Stakeholder";
      const org = str(s.org);
      const role = str(s.role);
      const heading = [name, [role, org].filter(Boolean).join(", ")].filter(Boolean).join(" — ");
      const positionStatus = str(s.positionStatus);
      const headingLabel = positionStatus && isVerificationLabel(positionStatus) ? positionStatus : undefined;
      b.push({ t: "h4", text: heading, label: headingLabel });
      const kv: Array<[string, string]> = [];
      const power = str(s.power);
      if (power) kv.push(["Power", power]);
      const position = str(s.position);
      if (position) kv.push(["Position", position]);
      if (positionStatus && !headingLabel) kv.push(["Position status", positionStatus]);
      const cares = str(s.cares);
      if (cares) kv.push(["Cares about", cares]);
      const ask = str(s.ask);
      if (ask) kv.push(["What we ask of them", ask]);
      const approach = str(s.approach);
      if (approach) kv.push(["Recommended approach", approach]);
      const evidence = str(s.evidence);
      if (evidence) kv.push(["Evidence", evidence]);
      const confidence = str(s.confidence);
      if (confidence) kv.push(["Confidence", confidence]);
      if (kv.length) b.push({ t: "kv", rows: kv });
    }
  }
  return b;
}

export function renderPressure(content: unknown): Block[] {
  const c = rec(content);
  const b: Block[] = [];
  const statusQuoCost = str(c.statusQuoCost);
  if (statusQuoCost) {
    b.push({ t: "h3", text: "Making the status quo costlier than change" });
    b.push({ t: "p", text: statusQuoCost, callout: "warm" });
  }
  const pressures = objArr(c.pressures);
  for (const pr of pressures) {
    const type = str(pr.type) || "Pressure";
    b.push({ t: "h4", text: type });
    const on = str(pr.on);
    const why = str(pr.why);
    if (why) b.push({ t: "p", text: on ? `Why it matters to ${on}: ${why}` : why });
    const whoApplies = str(pr.whoApplies);
    const channel = str(pr.channel);
    if (whoApplies || channel) {
      b.push({
        t: "p",
        text: `Who applies it: ${whoApplies || "—"}${channel ? ` · via ${channel}` : ""}`,
      });
    }
    const evidence = str(pr.evidence);
    if (evidence) b.push({ t: "p", text: `Evidence: ${evidence}` });
    const action = str(pr.action);
    if (action) b.push({ t: "p", text: `Campaign action that activates it: ${action}`, callout: "blue" });
  }
  return b;
}

export function renderStrategy(content: unknown): Block[] {
  const c = rec(content);
  const b: Block[] = [];
  const narrative = str(c.narrative);
  if (narrative) b.push({ t: "quote", text: narrative });
  const phases = objArr(c.phases);
  if (phases.length) {
    b.push({ t: "h3", text: "Phases" });
    b.push({
      t: "ol",
      items: phases.map((ph) => {
        const name = str(ph.name) || "Phase";
        const when = str(ph.when);
        const focus = str(ph.focus);
        return `${name}${when ? ` (${when})` : ""}${focus ? ` — ${focus}` : ""}`;
      }),
    });
  }
  const route = str(c.route);
  if (route) {
    b.push({ t: "h3", text: "Route to influence" });
    b.push({ t: "p", text: route });
  }
  const coalition = str(c.coalition);
  if (coalition) {
    b.push({ t: "h3", text: "Coalition strategy" });
    b.push({ t: "p", text: coalition });
  }
  pushList(b, "Priority audiences", strArr(c.audiences));
  pushList(b, "What the campaign will avoid", strArr(c.avoid));
  const escalation = str(c.escalation);
  if (escalation) {
    b.push({ t: "h3", text: "Escalation path" });
    b.push({ t: "p", text: escalation });
  }
  pushList(b, "Risks", strArr(c.risks));
  pushList(b, "Trade-offs", strArr(c.tradeoffs));
  pushList(b, "Signs it is working or failing", strArr(c.indicators));
  return b;
}

export function renderTactics(content: unknown): Block[] {
  const c = rec(content);
  const b: Block[] = [];
  const tactics = objArr(c.tactics);
  for (const t of tactics) {
    const name = str(t.name) || "Tactic";
    const phase = typeof t.phase === "number" ? `P${t.phase} ` : "";
    b.push({ t: "h4", text: `${phase}${name}` });
    const kv: Array<[string, string]> = [];
    const add = (k: string, key: string) => {
      const v = str(t[key]);
      if (v) kv.push([k, v]);
    };
    add("Type", "type");
    add("Target", "target");
    add("Owner", "owner");
    add("Purpose", "purpose");
    add("Timing", "timing");
    add("Dependencies", "dependencies");
    add("Success sign", "success");
    add("Human approval", "approval");
    add("Escalation", "escalation");
    if (kv.length) b.push({ t: "kv", rows: kv });
  }
  return b;
}

export function renderOrganising(content: unknown): Block[] {
  const c = rec(content);
  const b: Block[] = [];
  const whoActs = str(c.whoActs);
  if (whoActs) b.push({ t: "p", text: whoActs });
  const whyParticipate = str(c.whyParticipate);
  if (whyParticipate) {
    b.push({ t: "h3", text: "Why people will take part" });
    b.push({ t: "p", text: whyParticipate });
  }
  pushList(b, "The asks", strArr(c.asks));
  const roles = objArr(c.roles);
  if (roles.length) {
    b.push({ t: "h3", text: "Volunteer roles" });
    b.push({
      t: "kv",
      rows: roles.map((r): [string, string] => [str(r.role) || "Role", str(r.what) || "—"]),
    });
  }
  const oneToOne = strArr(c.oneToOne);
  if (oneToOne.length) {
    b.push({ t: "h3", text: "One-to-one conversation guide" });
    b.push({ t: "ol", items: oneToOne });
  }
  const ladder = objArr(c.ladder);
  if (ladder.length) {
    b.push({ t: "h3", text: "Ladder of engagement" });
    b.push({
      t: "ol",
      items: ladder.map((l) => {
        const rung = str(l.rung) || "Step";
        const action = str(l.action);
        return `${rung}${action ? ` — ${action}` : ""}`;
      }),
    });
  }
  pushList(b, "Coalition", strArr(c.coalition));
  pushList(b, "Channels", strArr(c.channels));
  const event = str(c.event);
  if (event) {
    b.push({ t: "h3", text: "Event" });
    b.push({ t: "p", text: event });
  }
  const followup = str(c.followup);
  if (followup) b.push({ t: "p", text: `Follow-up: ${followup}` });
  const sustain = str(c.sustain);
  if (sustain) b.push({ t: "p", text: `Sustaining participation: ${sustain}` });
  pushList(b, "Metrics", strArr(c.metrics));
  pushList(b, "Where trust and relationships stay human", strArr(c.humanEssential));
  return b;
}

export function renderDocumentsOverview(content: unknown): Block[] {
  const c = rec(content);
  const b: Block[] = [];
  const summary = str(c.summary);
  if (summary) b.push({ t: "p", text: summary });
  pushList(b, "Notes", strArr(c.notes));
  return b;
}

export const SECTION_RENDERERS: Record<JourneyStepKey, (content: unknown) => Block[]> = {
  problem: renderProblem,
  evidence: renderEvidence,
  objective: renderObjective,
  decision_route: renderDecisionRoute,
  power: renderPower,
  pressure: renderPressure,
  strategy: renderStrategy,
  tactics: renderTactics,
  organising: renderOrganising,
  documents: renderDocumentsOverview,
};
