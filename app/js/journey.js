/* Campaign journey — one scrollable page: problem → research → objective →
   decision → power → pressure → strategy → tactics → organising → drafts →
   document library → sources → how this was built.
   Renders entirely from the shared campaign object; documents come from CF_DOCS. */

(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const para = (s) => esc(s).replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br>");
  const li = (arr) => (arr || []).map(x => `<li>${esc(x)}</li>`).join("");

  const STATUS_CLS = {
    "Verified public information": "real", "Supported inference": "gen",
    "Generated campaign recommendation": "gen", "Campaign assumption": "mock",
    "Conflicting evidence": "verify", "Verification incomplete": "verify",
    "External information unavailable": "ext"
  };
  const stag = (status) => status ? `<span class="tag ${STATUS_CLS[status] || "gen"}">${esc(status)}</span>` : "";

  const NAV = [["problem", "Problem"], ["research", "Research"], ["objective", "Objective"], ["decision", "Decision"], ["power", "Power"], ["pressure", "Pressure"], ["strategy", "Strategy"], ["tactics", "Tactics"], ["organising", "Organising"], ["drafts", "Drafts"], ["documents", "Documents"], ["sources", "Sources"], ["how", "How it works"]];

  function head(id, kicker, title, sub) {
    return `<section class="jstage" id="j-${id}"><div class="jhead"><div class="eyebrow">${esc(kicker)}</div><h2>${title}</h2>${sub ? `<p class="jsub">${sub}</p>` : ""}</div>`;
  }

  /* embedded document dropdown */
  function docdrop(docs, id, note) {
    const d = docs.find(x => x.id === id);
    if (!d) return "";
    return `<details class="docdrop" data-doc="${d.id}">
      <summary><span><b>📄 ${esc(d.title)}</b> — ${esc(note || d.summary)}</span>
        <span class="dd-actions"><button class="toolbtn dd-copy" data-doc="${d.id}" title="Copy as Markdown">⧉</button><button class="toolbtn dd-dl" data-doc="${d.id}" title="Download Markdown">↓</button><button class="toolbtn dd-open" data-doc="${d.id}" title="Open full-page editor">✎</button></span></summary>
      <div class="docsheet dd-sheet" data-doc="${d.id}">${d.html}</div>
    </details>`;
  }

  function draftBlock(title, body, extra) {
    if (!body) return "";
    return `<div class="draftblock"><div class="db-head"><b>${esc(title)}</b><span class="dd-actions"><button class="toolbtn db-copy" title="Copy">⧉</button></span></div><div class="db-body"><p>${para(body)}</p></div>${extra || ""}</div>`;
  }

  function render(c, docs) {
    const L = c.live || {};
    const R = L.research || {};
    const D = L.drafts || {};
    const f = c.objective.formula;
    const liveMode = !!c.generatedLive;

    let h = `<nav class="subnav"><div class="subnav-in">${NAV.map(([id, label]) => `<a href="#j-${id}" data-nav="${id}">${label}</a>`).join("")}</div></nav>
    <div class="jwrap">
    <header class="jtitle">
      <div class="eyebrow">${liveMode ? "Live campaign · researched and generated just now" : "Simulated campaign · offline fallback mode"} · every output requires human review</div>
      <h1>${esc(c.name)}</h1>
      <p class="obj">We want <b>${esc(f.dm)}</b> to <b>${esc(f.action)}</b> by <b>${esc(f.by)}</b>, even if the immediate outcome is only <b>${esc(f.mvw)}</b>.</p>
    </header>`;

    /* 1 — problem */
    h += head("problem", "Stage 1", "The original problem", "The starting statement is treated as a hypothesis, not a brief — research tests it.");
    h += `<blockquote class="userquote">${esc(c.input.problem)}</blockquote>`;
    const opt = [["Organisation", c.input.org], ["Location", c.input.location], ["Desired outcome", c.input.outcome], ["Known decision-maker", c.input.dm], ["Timeframe", c.input.timeframe], ["People affected", c.input.affected], ["Known evidence", c.input.evidence], ["Resources", c.input.resources]].filter(x => x[1]);
    if (opt.length) h += `<div class="kvrow">${opt.map(([k, v]) => `<span class="kv"><b>${k}:</b> ${esc(v)}</span>`).join("")}</div>`;
    h += `<h3>How the system read it ${stag("Generated campaign recommendation")}</h3><p>${esc(c.interpretation || "A UK local/public-policy campaign problem: identify the responsible decision-maker, the decision at stake, and the route to influence it.")}</p>`;
    h += `<div class="cols2"><div><h3>Identified as missing</h3><ul>${li((R.missingInfo && R.missingInfo.length ? R.missingInfo : c.unknowns).slice(0, 6))}</ul></div>
      <div><h3>Questions the research had to answer</h3><ul>${li((R.researchQuestions || ["Who formally controls this decision?", "What is the current policy or restriction, exactly?", "What processes, meetings or deadlines apply?", "Who else has fought this, and how did it go?"]).slice(0, 6))}</ul></div></div></section>`;

    /* 2 — research */
    h += head("research", "Stage 2", "Researched context", liveMode ? "Live web research against authoritative UK sources. Every claim below is labelled and linked in the Sources section." : "Simulated mode — no live research ran; everything below is a labelled baseline requiring verification.");
    if (c.researchUnavailable) h += `<div class="warncall">Live research was unavailable for this run. The rest of the campaign is generated from the user's input alone and is labelled accordingly — treat all facts as unverified.</div>`;
    if (R.context) {
      h += `<div class="cols2"><div>
        <h3>The situation ${stag("Verified public information")}</h3><p>${para(R.context.situation)}</p>
        ${R.context.currentPolicy ? `<h3>Current policy / restriction</h3><p>${para(R.context.currentPolicy)}</p>` : ""}
        ${R.context.howItChanged ? `<h3>How research changed the request</h3><p>${para(R.context.howItChanged)}</p>` : ""}
      </div><div>
        <div class="mapph"><span class="pin" style="left:52%;top:44%"></span><div class="maplabel">${esc((R.location && R.location.area) || c.authority.area)} · map placeholder — real boundary geometry via future ONS integration</div></div>
        <h3>Key dates &amp; processes</h3><ul>${li(R.context.keyDates)}</ul>
        <h3>Institutions involved</h3><ul>${li(R.context.institutions)}</ul>
      </div></div>`;
    } else {
      h += `<p>${stag(liveMode ? "Verification incomplete" : "Campaign assumption")} ${esc(c.decisionMakers.process)}</p>
      <div class="mapph"><span class="pin" style="left:52%;top:44%"></span><div class="maplabel">${esc(c.authority.area)} · map placeholder</div></div>`;
    }
    const topClaims = (c.sources || []).slice(0, 6);
    if (topClaims.length) h += `<h3>Key claims on the record</h3>${topClaims.map(s => `<div class="cite"><span class="c-src">${esc(s.sourceOrg || s.sourceTitle || "Source")}</span><span>${esc(s.claim)} ${stag(s.status)}</span></div>`).join("")}<p class="hint-sm">Full source register with URLs, dates and filters in <a href="#j-sources">Sources &amp; verification</a>.</p>`;
    h += `<h3>Still unresolved</h3><ul>${li((R.unresolvedQuestions || c.unknowns).slice(0, 5))}</ul>`;
    h += docdrop(docs, "brief", "The campaign brief — problem, context, evidence, next actions") + `</section>`;

    /* 3 — objective */
    h += head("objective", "Stage 3", "Objective &amp; minimum viable win", "No materials until the objective passes the check. The formula keeps it honest.");
    h += `<div class="formula">We want <b>${esc(f.dm)}</b> to <b>${esc(f.action)}</b> by <b>${esc(f.by)}</b>, even if the immediate outcome is only <b>${esc(f.mvw)}</b>.</div>`;
    h += `<div class="cols2" style="margin-top:1.2rem"><div><h3>SMART assessment</h3><table>${(c.objective.smart || []).map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("")}</table></div>
      <div>${c.objective.success ? `<h3>Success looks like</h3><p>${esc(c.objective.success)}</p>` : ""}
      <h3>Constraints</h3><ul>${li(c.objective.constraints || c.strategy.constraints)}</ul>
      <h3>Assumptions needing human review</h3><ul>${li((c.assumptions || []).slice(0, 4))}</ul></div></div>`;
    h += docdrop(docs, "objective", "Objective, SMART test, theory of change, reconsideration conditions") + `</section>`;

    /* 4 — decision route */
    h += head("decision", "Stage 4", "The decision-making route", "Formal authority and practical influence are different maps. This is both.");
    h += `<div class="routeviz">
      <span class="rnode">You / the campaign</span><span class="rarrow">→</span>
      ${c.decisionMakers.implementer ? `<span class="rnode">${esc(c.decisionMakers.implementer)}<small>implements</small></span><span class="rarrow">→</span>` : ""}
      <span class="rnode dm">${esc(c.decisionMakers.formal)}<small>decides</small></span></div>`;
    h += `<div class="cols2"><div><h3>How it works in practice ${stag(liveMode && !c.researchUnavailable ? "Supported inference" : "Campaign assumption")}</h3><p>${esc(c.decisionMakers.practical)}</p>
      <h3>Processes &amp; committees</h3><ul>${li(c.decisionMakers.committees)}</ul></div>
      <div><h3>Intervention points</h3><ul>${li(c.decisionMakers.interventionPoints || ["Verify: the next relevant meeting, consultation window, or decision date — the campaign's clock starts there."])}</ul>
      <h3>Deadlines</h3><ul>${li(c.decisionMakers.deadlines || [c.decisionDateText])}</ul>
      ${(c.decisionMakers.unresolved && c.decisionMakers.unresolved.length) ? `<h3>Unresolved institutional questions</h3><ul>${li(c.decisionMakers.unresolved)}</ul>` : ""}</div></div></section>`;

    /* 5 — power map (interactive) */
    h += head("power", "Stage 5", "Power &amp; stakeholder map", "Click any stakeholder for the full profile — position, evidence, ask, approach, verification status.");
    const tiers = [["decides", "Decides"], ["influences", "Influences"], ["mobilises", "Mobilises"], ["resists", "May resist"], ["neutral", "Neutral"]];
    h += `<div class="pmap-live">`;
    tiers.forEach(([tier, label]) => {
      const rows = (c.stakeholders || []).filter(s => s.tier === tier);
      if (!rows.length) return;
      h += `<div class="pm-tier"><div class="pm-label">${label}</div><div class="pm-row">${rows.map((s, i) => {
        const idx = c.stakeholders.indexOf(s);
        const cls = tier === "decides" ? "dm" : tier === "mobilises" ? "ally" : tier === "resists" ? "opp" : tier === "neutral" ? "neut" : "";
        const size = s.power === "High" ? "big" : (s.power || "").startsWith("Medium") ? "" : "sm";
        return `<button class="pm-node ${cls} ${size}" data-stake="${idx}">${esc(s.name)}${s.positionStatus && STATUS_CLS[s.positionStatus] !== "real" ? `<i class="pm-inf" title="${esc(s.positionStatus || "inferred")}">?</i>` : ""}</button>`;
      }).join("")}</div></div>`;
    });
    h += `<p class="hint-sm">Node size ≈ power · colour = grouping · <i class="pm-inf">?</i> = position inferred or unverified, never confirmed. Relationships shown by tier are ${liveMode ? "researched where possible; unverified links are labelled in each profile" : "illustrative"}.</p></div>
    <aside class="stakepanel" id="stakepanel"><button class="toolbtn sp-close">✕</button><div id="stakepanel-body"></div></aside>`;
    h += docdrop(docs, "power", "The full prioritised stakeholder table with asks and approach") + `</section>`;

    /* 6 — pressure */
    h += head("pressure", "Stage 6", "Pressure analysis", esc(c.statusQuoCost));
    const pl = c.pressuresLive;
    if (pl && pl.length) {
      h += `<div class="pgrid">${pl.map(p => `<div class="pcardx"><div class="p-type">${esc(p.type)}</div><p><b>Why it matters to ${esc(p.on)}:</b> ${esc(p.why)}</p><p><b>Who applies it:</b> ${esc(p.whoApplies)} · <b>via</b> ${esc(p.channel)}</p><p><b>Evidence:</b> ${esc(p.evidence)}</p><p class="p-act"><b>Campaign action that activates it:</b> ${esc(p.action)}</p></div>`).join("")}</div>`;
    } else {
      h += `<table><tr><th>Pressure</th><th>How it lands here</th></tr>${(c.pressures || []).map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("")}</table>`;
    }
    h += `</section>`;

    /* 7 — strategy */
    h += head("strategy", "Stage 7", "Campaign strategy", "Why this approach could produce the decision — not a list of outputs.");
    h += `<blockquote class="narr">${esc(c.strategy.narrative)}</blockquote>
    <div class="cols2"><div>
      <h3>Route to influence</h3><p>${esc(c.strategy.route)}</p>
      ${c.strategy.coalition ? `<h3>Coalition strategy</h3><p>${esc(c.strategy.coalition)}</p>` : ""}
      <h3>Priority audiences</h3><ul>${li(c.strategy.audiences)}</ul>
      <h3>What the campaign will avoid</h3><ul>${li(c.strategy.avoid)}</ul>
    </div><div>
      <h3>Phases</h3><div class="tl">${(c.strategy.phases || []).map((p, i) => `<div class="tl-ph p${(i % 4) + 1}"><b>${esc(p.name)}</b><small>${esc(p.weeks)}</small><br>${esc(p.focus)}</div>`).join("")}</div>
      <h3>Resources &amp; constraints</h3><ul>${li([...(c.strategy.resources || []), ...(c.strategy.constraints || [])].slice(0, 6))}</ul>
      ${c.strategy.tradeoffs && c.strategy.tradeoffs.length ? `<h3>Trade-offs</h3><ul>${li(c.strategy.tradeoffs)}</ul>` : ""}
      <h3>Escalation path</h3><p>${esc(c.strategy.escalation)}</p>
      <h3>Signs it's working / failing</h3><ul>${li(c.strategy.indicators)}</ul>
    </div></div>`;
    h += docdrop(docs, "strategy", "The full strategy document") + `</section>`;

    /* 8 — tactics */
    h += head("tactics", "Stage 8", "Tactics &amp; timeline", "A sequence that builds pressure — each tactic has a target, an owner, a success sign, and a human approval point.");
    h += `<div class="tl" style="margin-bottom:1.2rem">${(c.strategy.phases || []).map((p, i) => `<div class="tl-ph p${(i % 4) + 1}"><b>${esc(p.name)}</b><small>${esc(p.weeks)}</small><br>${esc(p.focus)}</div>`).join("")}</div>`;
    h += (c.tactics || []).map(t => `<details class="tacx"><summary><span class="t-ph">P${esc(t.phase)}</span> <b>${esc(t.name)}</b> <span class="t-meta">${esc(t.type || "")} · target: ${esc(t.target)}</span></summary>
      <table>
      <tr><td><b>Purpose</b></td><td>${esc(t.purpose)}</td></tr>
      <tr><td><b>Owner</b></td><td>${esc(t.owner)}</td></tr>
      <tr><td><b>Pressure created</b></td><td>${esc(t.pressure)}</td></tr>
      <tr><td><b>Resources</b></td><td>${esc(t.resources)}</td></tr>
      <tr><td><b>Timing</b></td><td>${esc(t.timing)}${t.dependencies ? " · depends on: " + esc(t.dependencies) : ""}</td></tr>
      <tr><td><b>Expected result</b></td><td>${esc(t.expected || t.success)}</td></tr>
      <tr><td><b>Success sign</b></td><td>${esc(t.success)}</td></tr>
      <tr><td><b>Then</b></td><td>${esc(t.next)}${t.escalation && t.escalation !== "—" ? " · <b>escalation:</b> " + esc(t.escalation) : ""}</td></tr>
      <tr><td><b>Approval</b></td><td>${esc(t.approval)}</td></tr></table></details>`).join("");
    h += docdrop(docs, "tactics", "The tactical plan and timeline as a document") + `</section>`;

    /* 9 — organising */
    const o = c.organising;
    h += head("organising", "Stage 9", "Organising people", esc(o.whoActs));
    h += `<div class="cols2"><div>
      ${o.whyParticipate ? `<h3>Why people will take part</h3><p>${esc(o.whyParticipate)}</p>` : ""}
      <h3>The asks</h3><ul>${li(o.asks)}</ul>
      <h3>Volunteer roles</h3><table>${(o.roles || []).map(([r, w]) => `<tr><td><b>${esc(r)}</b></td><td>${esc(w)}</td></tr>`).join("")}</table>
      <h3>One-to-one conversation guide</h3><ol>${li(o.oneToOne)}</ol>
      ${o.coalition && o.coalition.length ? `<h3>Coalition partners to approach</h3><ul>${li(o.coalition)}</ul>` : ""}
    </div><div>
      <h3>Ladder of engagement</h3><table>${(o.ladder || []).map(([r, a]) => `<tr><td><b>${esc(r)}</b></td><td>${esc(a)}</td></tr>`).join("")}</table>
      <h3>Channels</h3><ul>${li(o.channels)}</ul>
      <h3>Event</h3><p>${esc(o.event)}</p>
      <h3>Follow-up &amp; sustaining participation</h3><p>${esc(o.followup)} ${esc(o.sustain)}</p>
      ${o.humanEssential && o.humanEssential.length ? `<h3>Where trust and relationships stay human</h3><ul>${li(o.humanEssential)}</ul>` : ""}
      <h3>Organising metrics</h3><ul>${li(o.metrics)}</ul>
    </div></div>`;
    h += docdrop(docs, "organising", "The full organising plan") + `</section>`;

    /* 10 — drafts */
    h += head("drafts", "Stage 10", "Drafted campaign resources", "Complete first drafts, generated from the shared plan. Square-bracketed [VERIFY: …] items are unresolved facts — never send without resolving them.");
    const lb = D.lobbying || {}, md = D.media || {}, dg = D.digital || {};
    h += `<h3 class="draftgroup">Lobbying</h3>`;
    h += draftBlock("Meeting-request email — to " + (f.dm.split("(")[0] || "the decision-maker"), lb.meetingEmail || fallbackDraft(docs, "lobbying"));
    h += draftBlock("Decision-maker briefing (one page)", lb.briefing);
    if (lb.talkingPoints && lb.talkingPoints.length) h += `<div class="draftblock"><div class="db-head"><b>Talking points &amp; questions to ask</b></div><div class="db-body"><ul>${li(lb.talkingPoints)}</ul><p><b>Questions to ask:</b></p><ul>${li(lb.questionsToAsk)}</ul></div></div>`;
    if (lb.objections && lb.objections.length) h += `<div class="draftblock"><div class="db-head"><b>Likely objections &amp; responses</b></div><div class="db-body"><table>${lb.objections.map(x => `<tr><td>“${esc(x.objection)}”</td><td>${esc(x.response)}</td></tr>`).join("")}</table></div></div>`;
    h += draftBlock("Doorknocking / public-conversation script", lb.doorknockScript || lb.contactScript);
    h += docdrop(docs, "lobbying", "Everything above plus agenda, follow-up email and escalation options");

    h += `<h3 class="draftgroup">Media</h3>`;
    if (md.headline) h += `<div class="draftblock"><div class="db-head"><b>Suggested headline</b></div><div class="db-body"><p style="font-size:1.25rem;font-weight:600">${esc(md.headline)}</p>${md.altAngles && md.altAngles.length ? `<p><b>Alternative angles:</b></p><ul>${li(md.altAngles)}</ul>` : ""}</div></div>`;
    h += draftBlock("Local press release", md.pressRelease || fallbackDraft(docs, "media"));
    h += draftBlock("Journalist pitch email", md.pitchEmail);
    if (md.quotes && md.quotes.length) h += `<div class="draftblock"><div class="db-head"><b>Draft spokesperson quotes</b> <span class="tag verify">Requires the named speaker's consent</span></div><div class="db-body">${md.quotes.map(q => `<p>“${esc(q.quote)}” — <em>${esc(q.voice)}</em>${q.note ? ` <span class="hint-sm">(${esc(q.note)})</span>` : ""}</p>`).join("")}</div></div>`;
    if (md.hostileQA && md.hostileQA.length) h += `<div class="draftblock"><div class="db-head"><b>Hostile questions &amp; answers</b></div><div class="db-body"><table>${md.hostileQA.map(x => `<tr><td>“${esc(x.q)}”</td><td>${esc(x.a)}</td></tr>`).join("")}</table></div></div>`;
    h += `<div class="ph"><div class="ph-t">📷 Proposed press photo <span class="tag ext">Image placeholder</span></div><div class="ph-s">${esc(md.visual || "Real people, real place, faces with consent — no stock imagery.")}</div></div>`;
    h += docdrop(docs, "media", "The full media pack: outlet list, timing, Q&A, spokespeople");

    h += `<h3 class="draftgroup">Digital</h3>`;
    h += draftBlock("Petition / action-page copy", dg.actionPageCopy || fallbackDraft(docs, "digital"));
    h += draftBlock("Supporter email", dg.supporterEmail);
    h += draftBlock("Volunteer recruitment message", dg.volunteerMessage);
    if (dg.socialPosts && dg.socialPosts.length) h += `<div class="draftblock"><div class="db-head"><b>Social posts</b></div><div class="db-body">${dg.socialPosts.map(p => `<p><span class="tag gen">${esc(p.platform)}</span> ${esc(p.text)}</p>`).join("")}</div></div>`;
    h += draftBlock("Supporter sharing message (person-to-person)", dg.sharingMessage);
    if (dg.faq && dg.faq.length) h += `<div class="draftblock"><div class="db-head"><b>Campaign FAQ</b></div><div class="db-body">${dg.faq.map(x => `<p><b>${esc(x.q)}</b><br>${esc(x.a)}</p>`).join("")}</div></div>`;
    h += docdrop(docs, "digital", "The full digital pack: landing copy, sequences, variants, graphics") + `</section>`;

    /* 11 — library */
    h += head("documents", "Campaign document library", "All nine documents", "One shared campaign plan behind every document. Open, edit, copy, or download each individually.");
    h += `<div class="docgrid">${docs.map(d => {
      const tmp = document.createElement("div"); tmp.innerHTML = d.html;
      const preview = (tmp.querySelector("blockquote, p:not(.docmeta)") || tmp).innerText.slice(0, 180);
      return `<div class="doccard"><span class="d-n">Document ${d.n} of 9 · ${liveMode ? "generated live" : "simulated"} · updated ${c.generatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span><h3>${esc(d.title)}</h3><div class="d-prev">${esc(preview)}</div>
      <div class="dd-actions"><button class="toolbtn dd-open" data-doc="${d.id}">Open</button><button class="toolbtn dd-open" data-doc="${d.id}" data-edit="1">✎ Edit</button><button class="toolbtn dd-copy" data-doc="${d.id}">⧉ Copy</button><button class="toolbtn dd-dl" data-doc="${d.id}">↓ Download</button></div></div>`;
    }).join("")}</div></section>`;

    /* 12 — sources */
    h += head("sources", "Sources &amp; verification", "Every source used", "Filter by verification status. Nothing invented is presented as verified.");
    const counts = {};
    (c.sources || []).forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });
    h += `<div class="srcfilters"><button class="toolbtn on" data-filter="all">All (${(c.sources || []).length})</button>${Object.keys(counts).map(k => `<button class="toolbtn" data-filter="${esc(k)}">${esc(k)} (${counts[k]})</button>`).join("")}</div>`;
    h += `<div class="srclist">` + (c.sources || []).map(s => `<div class="srccard" data-status="${esc(s.status)}">
      <div class="src-h"><b>${esc(s.sourceTitle || "Source")}</b> ${stag(s.status)} <span class="tag ${s.confidence === "High" ? "real" : s.confidence === "Low" ? "verify" : "mock"}">confidence: ${esc(s.confidence || "—")}</span></div>
      <p>${esc(s.claim)}</p>
      ${s.evidence ? `<p class="src-ev">“${esc(s.evidence)}”</p>` : ""}
      <p class="src-meta">${esc(s.sourceOrg || "")}${s.url ? ` · <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>` : ""}${s.date ? ` · published ${esc(s.date)}` : ""}${s.accessDate ? ` · accessed ${esc(s.accessDate)}` : ""}${s.usedFor ? ` · used in: ${esc(s.usedFor)}` : ""}</p>
    </div>`).join("") + `</div>`;
    if (!(c.sources || []).length) h += `<div class="warncall">No live sources — this campaign ran in simulated mode. Everything requires verification before use.</div>`;
    h += `<div class="cols2" style="margin-top:1.5rem"><div><h3>Research questions still unanswered</h3><ul>${li((R.unresolvedQuestions || c.unknowns).slice(0, 6))}</ul>
      ${c.searched && c.searched.length ? `<h3>What was searched</h3><ul>${li(c.searched.slice(0, 6))}</ul>` : ""}</div>
      <div><h3>Claims requiring human confirmation</h3><ul>${li((c.sources || []).filter(s => STATUS_CLS[s.status] === "verify" || STATUS_CLS[s.status] === "ext").map(s => s.claim).slice(0, 6))}</ul>
      <h3>Suggested next research actions</h3><ul>${li((c.qualityFlags && c.qualityFlags.length ? c.qualityFlags : ["Confirm the decision date on the published forward plan", "Verify officeholder names on the official website", "Request the officer report / relevant policy document"]).slice(0, 6))}</ul></div></div></section>`;

    /* 13 — how this was built */
    h += head("how", "How this was built", "One problem in, one connected campaign out", "");
    h += `<div class="howviz">
      <span class="rnode">Campaign input</span><span class="rarrow">→</span>
      <span class="rnode">Live research<small>web + public data</small></span><span class="rarrow">→</span>
      <span class="rnode dm">Shared campaign plan<small>one structured state</small></span><span class="rarrow">→</span>
      <span class="rnode">Specialist tasks<small>power · strategy · drafting · checking</small></span><span class="rarrow">→</span>
      <span class="rnode gate">Human review</span><span class="rarrow">→</span>
      <span class="rnode">Campaign resources</span>
    </div>
    <div class="cols2"><div><ul>
      <li>Campaign planning is divided into connected stages; research establishes the real local and institutional context first.</li>
      <li>One shared campaign state connects the objective, stakeholders, strategy, tactics, organising plan and all nine documents — change the objective and everything downstream changes with it.</li>
      <li>Specialist components research, map power, plan strategy, draft resources, and check evidence and consistency.</li>
    </ul></div><div><ul>
      <li>This proof of concept uses live research and generated drafts; facts it could not verify are labelled, never invented.</li>
      <li><b>Human review remains required.</b> Local knowledge, political judgement, relationships, and accountability for the campaign cannot be delegated to the system.</li>
      <li>Future versions connect structured UK public-data sources (councils, Parliament, consultations, ONS) and campaign-management tools.</li>
    </ul></div></div></section></div>`;

    return h;
  }

  function fallbackDraft(docs, id) {
    // In simulated mode, pull the first blockquote from the corresponding pack document
    const d = docs.find(x => x.id === id);
    if (!d) return "";
    const tmp = document.createElement("div"); tmp.innerHTML = d.html;
    const q = tmp.querySelector("blockquote");
    return q ? q.innerText : "";
  }

  /* stakeholder detail panel + interactions (wired by app.js after render) */
  function stakePanelHTML(s) {
    return `<div class="eyebrow">${esc(s.tier)} · power: ${esc(s.power)}</div>
      <h3 style="margin:0 0 .4rem">${esc(s.name)}</h3>
      ${s.org ? `<p class="src-meta">${esc(s.org)} · ${esc(s.role || "")}</p>` : `<p class="src-meta">${esc(s.role || "")}</p>`}
      <table>
        <tr><td><b>Position</b></td><td>${esc(s.position)} ${stag(s.positionStatus || (s.status === "real" ? "Verified public information" : "Campaign assumption"))}</td></tr>
        ${s.relationship ? `<tr><td><b>Relationship to the decision</b></td><td>${esc(s.relationship)}</td></tr>` : ""}
        <tr><td><b>Likely to care about</b></td><td>${esc(s.cares || s.motivation || "—")}</td></tr>
        <tr><td><b>What we ask of them</b></td><td>${esc(s.ask || s.askOf || "—")}</td></tr>
        <tr><td><b>Recommended approach</b></td><td>${esc(s.approach || "—")}</td></tr>
        ${s.evidence ? `<tr><td><b>Evidence</b></td><td>${esc(s.evidence)}</td></tr>` : ""}
        <tr><td><b>Confidence</b></td><td>${esc(s.confidence || "—")}</td></tr>
      </table>
      <p class="hint-sm">Inferred positions are starting points for human judgement — verify before acting on them.</p>`;
  }

  window.CF_JOURNEY = { render, stakePanelHTML };
})();
