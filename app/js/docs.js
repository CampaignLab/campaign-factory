/* Nine campaign documents, generated from ONE shared campaign object (window.CF_ENGINE.build).
   Generators are pure: campaign object in, HTML out. Replace with model calls later;
   keep the contract. Provenance tags: real / gen / mock / ext / verify. */

(function () {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const tag = (cls, txt) => `<span class="tag ${cls}">${txt}</span>`;
  const T = { real: tag("real", "Preloaded public data"), gen: tag("gen", "Generated analysis"), mock: tag("mock", "Mock contact for prototype"), ext: tag("ext", "External source required"), verify: tag("verify", "Verification required"), img: tag("ext", "Image placeholder"), api: tag("ext", "Future API integration"), illus: tag("mock", "Illustrative relationship") };

  const meta = (c, extra) => `<div class="docmeta">${esc(c.name)} · generated ${c.generatedAt.toLocaleDateString("en-GB")} · draft for human review — nothing here is approved for external use until a person signs it off.${extra ? " " + extra : ""}</div>`;
  const formula = (c) => `<div class="formula">We want <b>${esc(c.objective.formula.dm)}</b> to <b>${esc(c.objective.formula.action)}</b> by <b>${esc(c.objective.formula.by)}</b>, even if the outcome is only <b>${esc(c.objective.formula.mvw)}</b>.</div>`;
  const mapPh = (c) => `<div class="mapph"><span class="pin" style="left:52%;top:44%"></span><div class="maplabel">${esc(c.authority.area)} · real boundary geometry: ${c.authority.placeholder ? "external source required" : "ONS Open Geography (future integration)"} · ${T.img.replace(/<[^>]+>|/g, "")}Image placeholder</div></div>`;
  const photoPh = (label) => `<div class="ph"><div class="ph-t">📷 ${esc(label)} ${T.img}</div><div class="ph-s">Shot list: real people, real place, morning light, faces with consent. No stock imagery.</div></div>`;

  function docBrief(c) {
    return `
<h1>Campaign Brief</h1>${meta(c)}
<h2>The problem</h2>
<blockquote>${esc(c.input.problem)}</blockquote>
<p>${T.gen} ${esc(c.decisionMakers.process)}</p>
<h2>Who is affected</h2>
<ul>${c.affected.map(a => `<li>${esc(a)}</li>`).join("")}</ul>
<h2>Local context</h2>
<p>${c.authority.placeholder ? T.ext : T.real} <b>${esc(c.authority.name)}</b> — ${esc(c.authority.type)}${c.authority.governance ? ", " + esc(c.authority.governance) : ""}. Decision horizon: <b>${esc(c.decisionDateText)}</b>.</p>
${mapPh(c)}
<h2>Evidence we hold</h2>
${c.evidence.map(e => `<div class="cite"><span class="c-src">${esc(e.label)}</span><span>${esc(e.text)}</span></div>`).join("")}
<h2>What we don't know yet</h2>
<ul>${c.unknowns.map(u => `<li>${esc(u)} ${T.verify}</li>`).join("")}</ul>
<h2>Objective</h2>
${formula(c)}
<h2>Theory of change — summary</h2>
<p>${T.gen} Fill the formal record with individual, personal, material representations while giving the decision-maker a low-cost route to say yes (officers first, cover from councillors, warmth from media). Make proceeding unchanged the expensive option: ${esc(c.statusQuoCost.split(".")[0].toLowerCase())}.</p>
<h2>Campaign narrative</h2>
<blockquote>${esc(c.strategy.narrative)}</blockquote>
<h2>Major assumptions</h2>
<ul>${c.assumptions.map(a => `<li>${esc(a)}</li>`).join("")}</ul>
<h2>Risks</h2>
<ul>${c.risks.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
<h2>Immediate next actions</h2>
<ol><li>Verify the decision date and route on the council's published forward plan (this week).</li><li>Request the officer meeting (draft in the Lobbying Pack).</li><li>Recruit the first five captains from directly affected people.</li></ol>
<h2>Progress measures</h2>
<ul>${c.metrics.campaign.slice(0, 4).map(m => `<li>${esc(m)}</li>`).join("")}</ul>`;
  }

  function docObjective(c) {
    return `
<h1>Objective &amp; Theory of Change</h1>${meta(c)}
<h2>The objective</h2>
${formula(c)}
<p style="margin-top:.8rem">Desired decision: <b>${esc(c.objective.formula.action)}</b>. Primary decision-maker: <b>${esc(c.objective.formula.dm)}</b>. Secondary decision-makers: ${esc(c.decisionMakers.committees.join(" · "))}. Timeframe: <b>${esc(c.decisionDateText)}</b>.</p>
<h2>SMART assessment</h2>
<table><tr><th>Test</th><th>Assessment</th></tr>
${c.objective.smart.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join("")}</table>
<div class="warncall">A goal like “raise awareness” fails this table: no decision-maker, no done-state, no deadline. Awareness counts here only as a source of pressure on the decision above.</div>
<h2>Minimum viable win</h2>
<p>${esc(c.objective.formula.mvw)}. Anything beyond this is upside; anything less means re-planning, not despair.</p>
<h2>Theory of change</h2>
<p>${T.gen} <b>Activity → pressure → decision.</b> Organised residents (activity) create representations on the formal record, visible community backing, and cross-party political cover (pressure). That changes the decision-maker's calculus: proceeding unchanged now carries procedural, political and reputational cost, while our ask — ${esc(c.objective.formula.mvw)} — is the cheap, safe option (decision).</p>
<h2>Key assumptions</h2>
<ul>${c.assumptions.map(a => `<li>${esc(a)}</li>`).join("")}</ul>
<h2>Signs the theory is working</h2>
<ul><li>officers ask the campaign for information (you're in the file)</li><li>councillors seek to be associated with the issue</li><li>the representation count grows week on week</li><li>decision-makers' language shifts from “decided” to “listening”</li></ul>
<h2>When to reconsider the theory</h2>
<ul><li>the decision-maker turns out to be someone else (re-verify, re-target)</li><li>organised opposition outnumbers the campaign in the formal channel</li><li>two phases pass with no movement on any indicator — hold the retro, change the route, not just the volume</li></ul>`;
  }

  function docPower(c) {
    const tiers = { decides: "Must move (decides)", influences: "Can move them (influences)", mobilises: "Can mobilise others", resists: "May resist" };
    return `
<h1>Power &amp; Stakeholder Map</h1>${meta(c, T.illus + " — positions are role-based starting points, not verified facts.")}
<h2>Visual power map</h2>
<div class="pmap">
  <div class="lvl">Decides</div>
  <div class="row"><span class="nd dm">${esc(c.stakeholders[0].name)}</span><span class="nd dm">Lead officer</span></div>
  <div class="arrows">↑ &nbsp; ↑</div>
  <div class="lvl">Influences</div>
  <div class="row"><span class="nd">Ward councillors</span><span class="nd">Scrutiny members</span><span class="nd">Local MP</span><span class="nd">Local media</span></div>
  <div class="arrows">↑ &nbsp; ↑ &nbsp; ↑</div>
  <div class="lvl">Mobilises</div>
  <div class="row"><span class="nd ally">Affected residents &amp; users</span><span class="nd ally">Community organisations</span><span class="nd ally">${esc(c.input.org || "Campaign core team")}</span></div>
  <div class="row" style="margin-top:.8rem"><span class="nd opp">Beneficiaries of the decision</span><span class="nd neut">Undecided residents</span></div>
</div>
<p style="font-size:.85rem;color:#737373">${T.illus} Relationships shown are the standard route for this decision type; verify against the real cast before use.</p>
<h2>Prioritised stakeholder table</h2>
<table><tr><th>Who</th><th>Role &amp; tier</th><th>Power</th><th>Likely position</th><th>Ask</th><th>Approach</th><th>Confidence</th></tr>
${c.stakeholders.map(s => `<tr><td><b>${esc(s.name)}</b>${s.status === "verify" ? "<br>" + T.ext : s.status === "real" ? "<br>" + T.real : "<br>" + T.gen}</td><td>${esc(s.role)}<br><em>${tiers[s.tier] || s.tier}</em></td><td>${esc(s.power)}</td><td>${esc(s.position)}</td><td>${esc(s.askOf)}</td><td>${esc(s.approach)}</td><td>${esc(s.confidence)}</td></tr>`).join("")}</table>
<div class="callout"><b>Officeholder names.</b> This prototype never invents names for public officials. ${T.ext} — the council/body website lists current cabinet members, committee chairs and officers; a future integration pulls them automatically (see data adapters).</div>
<h2>How the decision moves in practice</h2>
<p>${T.gen} ${esc(c.decisionMakers.practical)}</p>`;
  }

  function docStrategy(c) {
    return `
<h1>Campaign Strategy</h1>${meta(c)}
<h2>Strategic objective</h2>
${formula(c)}
<h2>Narrative</h2>
<blockquote>${esc(c.strategy.narrative)}</blockquote>
<h2>Priority audiences</h2>
<ul>${c.strategy.audiences.map(a => `<li>${esc(a)}</li>`).join("")}</ul>
<p style="font-size:.85rem;color:#737373">Audiences are broad, non-sensitive categories only — this system does not profile individual voters.</p>
<h2>Targets and route to influence</h2>
<p><b>Primary:</b> ${esc(c.objective.formula.dm)}. <b>Secondary:</b> ${esc(c.decisionMakers.committees.join(" · "))}.</p>
<p>${T.gen} ${esc(c.strategy.route)}</p>
<h2>Pressure strategy</h2>
<p>${esc(c.statusQuoCost)}</p>
<table><tr><th>Pressure type</th><th>How it lands here</th></tr>
${c.pressures.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("")}</table>
<h2>Phases</h2>
<div class="tl">${c.strategy.phases.map((p, i) => `<div class="tl-ph p${i + 1}"><b>${esc(p.name)}</b><small>${esc(p.weeks)}</small><br>${esc(p.focus)}</div>`).join("")}</div>
<h2>Resource constraints</h2>
<ul>${c.strategy.constraints.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
<h2>What this campaign will not do</h2>
<ul>${c.strategy.avoid.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
<h2>Escalation path</h2>
<p>${esc(c.strategy.escalation)} Escalation is a core-team decision at a review point — never automatic.</p>
<h2>Strategic progress measures</h2>
<ul>${c.strategy.indicators.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
<h2>Risks</h2>
<ul>${c.risks.map(r => `<li>${esc(r)}</li>`).join("")}</ul>`;
  }

  function docTactics(c) {
    const ph = c.strategy.phases;
    return `
<h1>Tactics &amp; Timeline</h1>${meta(c)}
<h2>Visual timeline</h2>
<div class="tl">${ph.map((p, i) => `<div class="tl-ph p${i + 1}"><b>${esc(p.name)}</b><small>${esc(p.weeks)}</small><br>${esc(p.focus)}</div>`).join("")}</div>
<p>Decision day: <b>${esc(c.decisionDateText)}</b>. Review points close each phase; the phase-3 review is the escalation decision point.</p>
<h2>Tactical plan</h2>
${c.tactics.map(t => `
<h3>${esc(ph[t.phase - 1].name)} · ${esc(t.name)}</h3>
<table>
<tr><td style="width:9.5rem"><b>Purpose</b></td><td>${esc(t.purpose)}</td></tr>
<tr><td><b>Target</b></td><td>${esc(t.target)}</td></tr>
<tr><td><b>Owner</b></td><td>${esc(t.owner)}</td></tr>
<tr><td><b>Pressure created</b></td><td>${esc(t.pressure)}</td></tr>
<tr><td><b>Timing</b></td><td>${esc(t.timing)}</td></tr>
<tr><td><b>Success looks like</b></td><td>${esc(t.success)}</td></tr>
<tr><td><b>Then</b></td><td>${esc(t.next)}${t.escalation !== "—" ? " · <b>escalation:</b> " + esc(t.escalation) : ""}</td></tr>
<tr><td><b>Approval</b></td><td>${esc(t.approval)}</td></tr>
</table>`).join("")}
<div class="callout"><b>Human approval points.</b> Everything marked “external” is approved and delivered by named people. Nothing escalates on a schedule; the phase-3 review decides. The creative tactic (${esc(c.creativeTactic.name)}) passes the deck's tech test: ${esc(c.creativeTactic.tech)}.</div>`;
  }

  function docOrganising(c) {
    const o = c.organising;
    return `
<h1>Organising Plan</h1>${meta(c)}
<h2>Who needs to act</h2>
<p>${esc(o.whoActs)}.</p>
<h2>The asks</h2>
<ul>${o.asks.map(a => `<li>${esc(a)}</li>`).join("")}</ul>
<h2>Volunteer roles</h2>
<table><tr><th>Role</th><th>What they do</th></tr>${o.roles.map(([r, d]) => `<tr><td><b>${esc(r)}</b></td><td>${esc(d)}</td></tr>`).join("")}</table>
<h2>Supporter journey — ladder of engagement</h2>
<table><tr><th>Rung</th><th>The concrete action</th></tr>${o.ladder.map(([r, d]) => `<tr><td><b>${esc(r)}</b></td><td>${esc(d)}</td></tr>`).join("")}</table>
<h2>Recruitment</h2>
<p>Face-to-face where people already are — at ${esc(c.asset)}, at the school gate, at the bus stop, in existing group chats via trusted members. The first five captains recruit the next twenty-five. Reduce barriers: every ask is small, timed, and comes from someone known.</p>
<h2>One-to-one conversation guide</h2>
<ol>${o.oneToOne.map(b => `<li>${esc(b)}</li>`).join("")}</ol>
<h2>Community event</h2>
<p>${esc(o.event)}.</p>
<h2>Channels</h2>
<ul>${o.channels.map(ch => `<li>${esc(ch)}</li>`).join("")}</ul>
<h2>Coalition opportunities</h2>
<p>Each allied organisation gets one named liaison and one specific, small ask (a statement, a share, a venue). See the stakeholder map for the list. ${T.api} — a future Charity Commission integration suggests local groups automatically.</p>
<h2>Follow-up &amp; sustaining participation</h2>
<p>${esc(o.followup)}. ${esc(o.sustain)}.</p>
<h2>Volunteer briefing (one page, give to every new volunteer)</h2>
<blockquote>What we want: ${esc(c.objective.formula.mvw)}. Who decides: ${esc(c.objective.formula.dm)}. When: ${esc(c.decisionDateText)}. Your job this week: one conversation, one representation, one friend. Never: speak for the campaign to media without the media lead; invent facts; argue with opponents on the doorstep. Always: log your conversations; ask for help; take the credit — it's yours.</blockquote>
<h2>Organising metrics &amp; review</h2>
<ul>${o.metrics.map(m => `<li>${esc(m)}</li>`).join("")}</ul>
<p>Retro at each phase end: what to stop, keep, try. “It just fails” is normal — iteration is the method.</p>`;
  }

  function docLobbying(c) {
    return `
<h1>Lobbying Pack</h1>${meta(c, T.verify + " — everything about specific officeholders must be verified before use; this pack never invents names or positions.")}
<h2>Engagement ladder</h2>
<ol><li><b>Lead officer</b> — they write the report; win the file first.</li><li><b>Portfolio holder / committee chair</b> — the effective decision-maker; no surprises.</li><li><b>Ward councillors (all parties)</b> — cover, via a joint letter.</li><li><b>MP — last, sparingly</b> — no formal role; a supportive letter only.</li></ol>
<h2>Decision-maker briefing (one page)</h2>
<blockquote><b>${esc(c.name)}</b> · Re: ${esc(c.asset)} — decision expected ${esc(c.decisionDateText)}.<br><br>
${esc(c.input.problem)}<br><br>
We ask you to ${esc(c.objective.formula.action)}. At minimum: ${esc(c.objective.formula.mvw)}.<br><br>
${esc(c.decisionMakers.process)}</blockquote>
<h2>Key arguments (ranked for this decision-maker)</h2>
<ol><li><b>Procedural safety:</b> our ask is the low-risk option — it survives scrutiny, consultation challenge and audit; the current course may not.</li><li><b>The record:</b> individual representations from affected residents are accumulating on the formal record and must be weighed.</li><li><b>Cost, reframed:</b> the savings case is smaller than it looks once alternatives, transition costs and the cost of a contested decision are counted. ${T.verify} — request the officer report's figures.</li><li><b>Cover:</b> cross-party ward support means no one loses politically by agreeing.</li></ol>
<h2>Meeting request email</h2>
<blockquote>Subject: ${esc(c.asset)} — request for a short meeting before the decision<br><br>
Dear [name — from the council website ${T.ext.replace(/<[^>]*>/g, "")}],<br><br>
We represent residents directly affected by the ${esc(c.kind)} decision on ${esc(c.asset)}, expected around ${esc(c.decisionDateText)}. Before the decision is finalised we would welcome 30 minutes to share residents' evidence and a costed alternative. Two of us would attend, including one directly affected resident. We can meet at your convenience.<br><br>
[Names · ${esc(c.input.org || "campaign")} · contact]</blockquote>
<h2>Meeting agenda &amp; talking points</h2>
<ul><li>Agenda: introductions (2') · residents' evidence (8') · the alternative and MVW (10') · what would help you say yes? (8') · next steps (2')</li>
<li>Open with the resident's story, not statistics.</li><li>Make the ask exactly once, in formula form.</li><li>Ask: “What evidence would change this decision?” and “Who else should we speak to?” — write the answers down.</li><li>Never bluff. “We'll find out” beats a wrong number.</li></ul>
<h2>Likely objections &amp; responses</h2>
<table><tr><th>Objection</th><th>Response</th></tr>
<tr><td>“The budget decision is already made.”</td><td>The framework is set; this line item and its alternatives are not. Deferral costs a report; a contested decision costs more.</td></tr>
<tr><td>“Consultation has closed / is running.”</td><td>Representations to decision-makers remain valid until the decision; and consultation adequacy is exactly what scrutiny examines.</td></tr>
<tr><td>“Others manage without this.”</td><td>Our evidence is about the people who can't — see the affected-residents section of the file.</td></tr></table>
<h2>Constituent contact script (doorstep / surgery)</h2>
<blockquote>“Hi — I'm [name], I live on [street]. I'm one of your constituents affected by the ${esc(c.asset)} decision. It matters to me because [one sentence, personal]. Will you support ${esc(c.objective.formula.mvw)}? … Thank you — can we count you as a public supporter?”</blockquote>
<p style="font-size:.85rem;color:#737373">Constituents speak for themselves; the campaign never scripts words into a named official's mouth.</p>
<h2>Follow-up email (after any meeting)</h2>
<blockquote>Thank you for meeting us on [date]. As discussed: [two bullet summary]. You asked for [evidence requested] — attached. We'll write again on [date]. Our ask remains: ${esc(c.objective.formula.mvw)}.</blockquote>
<h2>If engagement is refused — escalation options</h2>
<ol><li>Formal written representation into the statutory/consultation channel (must be considered).</li><li>Scrutiny call-in request, briefed through the chair.</li><li>Petition presented at Full Council.</li><li>Media accountability angle (see Media Pack) — last, because the target is a future ally.</li></ol>`;
  }

  function docMedia(c) {
    const outlets = c.media.outlets || [];
    return `
<h1>Media Pack</h1>${meta(c, "Quotes are drafts requiring the named speaker's consent — never auto-attributed.")}
<h2>Press release — draft</h2>
<blockquote>
<b>${esc(c.media.headline)}</b><br><br>
Residents in ${esc(c.authority.area)} have launched <b>${esc(c.name)}</b> ahead of a decision on ${esc(c.asset)} expected around <b>${esc(c.decisionDateText)}</b>.<br><br>
${esc(c.input.problem)}<br><br>
The campaign is asking ${esc(c.objective.formula.dm)} to ${esc(c.objective.formula.action)} — at minimum, ${esc(c.objective.formula.mvw)}.<br><br>
“${esc(c.strategy.narrative)}” said [campaign spokesperson — name and consent required ${T.verify.replace(/<[^>]*>/g, "")}].<br><br>
[Second quote: a directly affected resident, in their own words — gathered at a response party, with consent.]<br><br>
<b>Notes to editors:</b> the campaign can arrange photography and interviews with affected residents at ${esc(c.asset)}; decision timeline and public documents available on request. Contact: [campaign media lead].
</blockquote>
<h2>Journalist pitch email</h2>
<blockquote>Subject: ${esc(c.authority.area)}: ${esc(c.asset)} decision lands ${esc(c.deadline.assumed ? "within weeks" : c.decisionDateText)} — residents organising<br><br>
Hi [first name],<br><br>
The decision on ${esc(c.asset)} is expected around ${esc(c.decisionDateText)} and residents have organised on it — there's a live local fight with a deadline, real people affected, and strong pictures (${esc(c.media.angles[0].toLowerCase())}).<br><br>
Happy to set up interviews this week — [two named, consenting voices] — and share the public documents. Would this work for you or a colleague?<br><br>
[Media lead · phone · ${esc(c.name)}]</blockquote>
<h2>Story angles</h2>
<ol>${c.media.angles.map(a => `<li>${esc(a)}</li>`).join("")}</ol>
<h2>Local media list</h2>
<table><tr><th>Outlet ${T.real}</th><th>Type</th><th>Contact</th></tr>
${outlets.map(o => `<tr><td><b>${esc(o.outlet)}</b></td><td>${esc(o.type)}</td><td>${T.mock} — verify the current local democracy reporter / news desk by hand</td></tr>`).join("")}</table>
${(window.CF_MEDIA_MOCK_CONTACTS || []).map(m => `<div class="contactcard"><span class="av">📰</span><span class="cc-b"><span class="cc-n">${esc(m.role)}</span><br><span class="cc-s">${esc(m.note)}</span></span>${T.mock}</div>`).join("")}
<h2>Spokespeople</h2>
<p>One campaign voice (consistent, briefed) plus two directly affected residents (authentic, protected — never send anyone to a hostile interview alone). Draft quotes below are <b>starting points for real people's own words</b>:</p>
<ul><li>Campaign voice: “${esc(c.strategy.narrative.split(".")[0])}.”</li><li>Resident voice: “[their own words — one concrete detail about what ${esc(c.asset)} means in their week]”</li></ul>
<h2>Q&amp;A — including hostile questions</h2>
<table><tr><th>Question</th><th>Answer line</th></tr>
<tr><td>“Isn't this just a noisy minority?”</td><td>“The representations on the council's own record say otherwise — and they're from named local residents, individually written.”</td></tr>
<tr><td>“The council has to save money — what would you cut instead?”</td><td>“We've put a costed alternative to officers. The saving here is smaller than it looks; what's lost is not.”</td></tr>
<tr><td>“Isn't this political?”</td><td>“It's local. We have supporters — and we're seeking supporters — from every party and none.”</td></tr></table>
<h2>Timing &amp; visuals</h2>
<p>Pitch at phase-2 start; bank warm coverage before the endgame; give the photographer people, not buildings.</p>
${photoPh("Press photo — affected residents at " + c.asset)}`;
  }

  function docDigital(c) {
    return `
<h1>Digital Campaign Pack</h1>${meta(c, "Copy serves the strategy: every asset drives the ONE action that counts — " + esc(c.digital.ask) + ".")}
<h2>Landing page copy</h2>
<blockquote><b>${esc(c.name)}</b><br>
${esc(c.strategy.narrative)}<br><br>
The decision lands around <b>${esc(c.decisionDateText)}</b>. The single most useful thing you can do takes three minutes: ${esc(c.digital.ask)}.<br><br>
[ Do it now → ] &nbsp; [ Volunteer → ] &nbsp; [ Read the evidence → ]</blockquote>
<h2>Action page (the one action)</h2>
<blockquote><b>Write to the decision-makers — 3 minutes</b><br>
We've drafted the formal parts. The middle is yours, because <b>personal reasons are weighed; templates are bundled</b>.<br><br>
Required fields: your street · your connection to ${esc(c.asset)} · one specific thing this decision changes for you.<br><br>
[ Send my representation ] — sends from <b>your</b> email, in your name. This system never sends anything on your behalf.</blockquote>
<h2>Supporter email sequence</h2>
<ul>
<li><b>Launch:</b> subject “The ${esc(c.asset.replace(/^the /, ""))} decision is coming — 3 minutes to have your say” — the story, the date, the one action.</li>
<li><b>Halfway:</b> subject “[N] neighbours have written. Have you?” — progress + the action. ${T.gen}</li>
<li><b>Final week:</b> subject “After [date], the window closes” — last call, plus decision-day details.</li>
</ul>
<h2>Volunteer recruitment message</h2>
<blockquote>“We need ten people to give one hour a week until ${esc(c.deadline.assumed ? "the decision" : c.decisionDateText)}: host a kitchen-table session, be a street captain, or help at the public meeting. No experience needed — you'll be trained and never on your own. Reply and [named organiser] will call you.”</blockquote>
<h2>Social posts (broad audience variations)</h2>
<ul>
<li><b>Neighbour voice:</b> “The decision on ${esc(c.asset)} lands ${esc(c.deadline.assumed ? "within weeks" : "on " + c.decisionDateText)}. If it matters to your family, say so — it takes 3 minutes: [link]”</li>
<li><b>Parent/user voice:</b> “[one concrete detail]. That's what's at stake. 3 minutes: [link]”</li>
<li><b>Community-group voice:</b> “Our members rely on ${esc(c.asset)}. We've asked the council for ${esc(c.objective.formula.mvw.split("—")[0].trim())}. You can too: [link]”</li>
</ul>
<h2>Sharing message (person-to-person)</h2>
<blockquote>“Hi — you know the plans for ${esc(c.asset)}? The decision's ${esc(c.deadline.assumed ? "soon" : "around " + c.decisionDateText)} and the council does read individual letters. Took me 3 minutes: [link]. Would mean a lot if you did it too.”</blockquote>
<h2>Campaign FAQ (extract)</h2>
<ul>
<li><b>Will one email really matter?</b> Individual, personal representations must be weighed by decision-makers; identical templates get bundled as one. That's why we ask for your own words.</li>
<li><b>Who's behind this?</b> ${esc(c.input.org || "Local residents")} — contact and governance on the landing page.</li>
<li><b>Is this party political?</b> No. The ask is open to every party and none.</li>
</ul>
<h2>Content sequence</h2>
<p>Launch (with the press moment) → weekly progress (the counter/${esc(c.creativeTactic.name.toLowerCase())}) → mobilisation pushes ×3 → final week countdown → decision-day live → thank-you/next-steps regardless of result.</p>
<h2>Graphic concepts</h2>
<ul><li>The date, huge: “${esc(c.decisionDateText)} — the day the decision lands.”</li><li>Progress counter tile for reshares.</li><li>Quote cards: real residents, real words, consented.</li></ul>
${photoPh("Social/graphic hero image — real supporters, real place")}`;
  }

  /* ---------- live-draft variants (used when live generation succeeded) ---------- */
  const paraQ = (s) => `<blockquote>${esc(s).replace(/\n\n+/g, "<br><br>").replace(/\n/g, "<br>")}</blockquote>`;
  const qaT = (rows) => `<table><tr><th>Question</th><th>Answer</th></tr>${(rows || []).map(x => `<tr><td>“${esc(x.q || x.objection)}”</td><td>${esc(x.a || x.response)}</td></tr>`).join("")}</table>`;

  function docLobbyingLive(c) {
    const l = c.live.drafts.lobbying;
    return `<h1>Lobbying Pack</h1>${meta(c, T.verify + " — [VERIFY: …] items are unresolved facts; resolve before any external use.")}
<h2>Decision-maker briefing</h2>${paraQ(l.briefing)}
<h2>Meeting request email</h2>${paraQ(l.meetingEmail)}
<h2>Meeting agenda</h2>${paraQ(l.agenda)}
<h2>Key arguments</h2><ol>${(l.keyArguments || []).map(x => `<li>${esc(x)}</li>`).join("")}</ol>
<h2>Talking points</h2><ul>${(l.talkingPoints || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
<h2>Questions to ask</h2><ul>${(l.questionsToAsk || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
<h2>Likely objections &amp; responses</h2>${qaT(l.objections)}
<h2>Contact script</h2>${paraQ(l.contactScript)}
${l.doorknockScript ? `<h2>Doorknocking / public-conversation script</h2>${paraQ(l.doorknockScript)}` : ""}
<h2>Follow-up email</h2>${paraQ(l.followupEmail)}
<h2>Escalation options</h2><ol>${(l.escalationOptions || []).map(x => `<li>${esc(x)}</li>`).join("")}</ol>`;
  }

  function docMediaLive(c) {
    const m = c.live.drafts.media;
    const outlets = (c.mediaLive && c.mediaLive.length) ? c.mediaLive : (c.media.outlets || []).map(o => o.outlet + " — " + o.type);
    return `<h1>Media Pack</h1>${meta(c, "Quotes are drafts for real people to adapt — never auto-attributed to a named person.")}
<h2>Suggested headline</h2><p style="font-size:1.3rem;font-weight:600">${esc(m.headline)}</p>
<h2>Local press release — draft</h2>${paraQ(m.pressRelease)}
<h2>Journalist pitch email</h2>${paraQ(m.pitchEmail)}
<h2>Alternative story angles</h2><ol>${(m.altAngles || []).map(x => `<li>${esc(x)}</li>`).join("")}</ol>
<h2>Local media list</h2><ul>${outlets.map(o => `<li>${esc(o)} ${T.real}</li>`).join("")}</ul>
<p>${T.mock} Journalist contact details require human verification — this system never invents names or emails.</p>
<h2>Spokespeople</h2><p>${esc(m.spokespeople)}</p>
<h2>Draft quotes</h2>${(m.quotes || []).map(q => `<blockquote>“${esc(q.quote)}” — <em>${esc(q.voice)}</em>${q.note ? ` (${esc(q.note)})` : ""}</blockquote>`).join("")}
<h2>Media Q&amp;A</h2>${qaT(m.qa)}
<h2>Hostile questions</h2>${qaT(m.hostileQA)}
<h2>Timing</h2><p>${esc(m.timing)}</p>
<h2>Proposed visual</h2><p>${esc(m.visual)} ${T.img}</p>${photoPh("Press photo")}`;
  }

  function docDigitalLive(c) {
    const d = c.live.drafts.digital;
    return `<h1>Digital Campaign Pack</h1>${meta(c, "Every asset drives the campaign's strategic call to action — not generic promotion.")}
<h2>Landing page copy</h2>${paraQ(d.landingCopy)}
<h2>Petition / action-page copy</h2>${paraQ(d.actionPageCopy)}
<h2>Supporter email</h2>${paraQ(d.supporterEmail)}
<h2>Volunteer recruitment message</h2>${paraQ(d.volunteerMessage)}
<h2>Social posts</h2>${(d.socialPosts || []).map(p => `<p><b>${esc(p.platform)}:</b> ${esc(p.text)}</p>`).join("")}
<h2>Broad audience variations</h2>${(d.audienceVariants || []).map(v => `<p><b>${esc(v.audience)}:</b> ${esc(v.text)}</p>`).join("")}
<h2>Supporter sharing message</h2>${paraQ(d.sharingMessage)}
<h2>Campaign FAQ</h2>${qaT(d.faq)}
<h2>Calls to action</h2><ul>${(d.ctas || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
<h2>Content sequence</h2><p>${esc(d.contentSequence)}</p>
<h2>Graphic concepts</h2><ul>${(d.graphicConcepts || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>${photoPh("Hero image — real supporters, real place")}`;
  }

  window.CF_DOCS = function (c) {
    const live = c.live && c.live.drafts;
    return [
      { id: "brief", n: 1, title: "Campaign Brief", summary: "Problem, evidence, objective, narrative, risks, next actions.", html: docBrief(c) },
      { id: "objective", n: 2, title: "Objective & Theory of Change", summary: "The check-in formula, SMART test, minimum viable win, and why it can work.", html: docObjective(c) },
      { id: "power", n: 3, title: "Power & Stakeholder Map", summary: "Who decides, who influences, who mobilises, who resists — with asks.", html: docPower(c) },
      { id: "strategy", n: 4, title: "Campaign Strategy", summary: "Narrative, route to influence, pressure, phases, escalation, what to avoid.", html: docStrategy(c) },
      { id: "tactics", n: 5, title: "Tactics & Timeline", summary: "Sequenced tactics with owners, targets, success signs and approval points.", html: docTactics(c) },
      { id: "organising", n: 6, title: "Organising Plan", summary: "Roles, ladder of engagement, one-to-ones, events, follow-up, retros.", html: docOrganising(c) },
      { id: "lobbying", n: 7, title: "Lobbying Pack", summary: "Briefing, meeting email, talking points, objections, scripts, escalation.", html: (live && live.lobbying) ? docLobbyingLive(c) : docLobbying(c) },
      { id: "media", n: 8, title: "Media Pack", summary: "Press release, pitch, angles, outlet list, Q&A, spokespeople, visuals.", html: (live && live.media) ? docMediaLive(c) : docMedia(c) },
      { id: "digital", n: 9, title: "Digital Campaign Pack", summary: "Landing page, action page, emails, social posts, FAQ, sequence.", html: (live && live.digital) ? docDigitalLive(c) : docDigital(c) }
    ];
  };
})();
