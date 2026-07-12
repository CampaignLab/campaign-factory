/* Campaign engine — builds ONE shared campaign object from user input.
   Simulated generation: deterministic, offline, seeded variation. The framework
   order follows the two workshop decks: problem → objective (check-in formula,
   SMART, minimum viable win, theory of change) → decision-makers → power &
   stakeholders → pressure → strategy → tactics → organising → resources.
   Replace build() internals with model/agent calls later; keep the object shape. */

(function () {
  const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };

  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }
  function pick(arr, seed, salt) { return arr[(seed + (salt || 0)) % arr.length]; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function fmtDate(d) { return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  function addWeeks(w) { const d = new Date(); d.setDate(d.getDate() + w * 7); return d; }

  /* ---------- scenario archetypes ---------- */
  const SCENARIOS = {
    library: {
      kw: ["library", "libraries"], asset: "the library", kind: "public-service closure",
      dmFormal: (a) => `${a}'s Cabinet (portfolio holder for culture/communities)`,
      committees: ["Cabinet", "Overview & Scrutiny Committee (call-in power)", "Full Council (budget framework)"],
      process: "Library closures are executive decisions, normally preceded by a public consultation; councils must keep a 'comprehensive and efficient' library service under the Public Libraries and Museums Act 1964, and closure decisions are call-in-able by scrutiny and judicially reviewable if consultation is inadequate.",
      affected: ["regular borrowers and families", "older residents and people without home internet", "children doing homework", "community groups using the space", "library staff"],
      pressures: [
        ["Legal / procedural", "the 1964 Act duty + consultation adequacy — a credible pre-action letter makes closure the risky option"],
        ["Reputational", "'council closes children's library' is a durable negative story; libraries photograph well"],
        ["Electoral", "closures concentrate anger in specific wards ahead of the next local elections"],
        ["Internal", "scrutiny call-in forces the decision into a second, public examination"],
        ["Financial (reframed)", "closure savings are small against reputational/legal cost; community-supported alternatives keep assets open"]
      ],
      mvwByAsk: { delay: "the decision is deferred for a genuine options appraisal (staffing models, community partnership, reduced hours) before any closure vote", reverse: "the closure item is withdrawn from the next Cabinet agenda pending a compliant consultation", default: "a formal commitment that no closure proceeds until alternatives have been publicly assessed" },
      narrative: ["This isn't nostalgia — it's the last free, warm, staffed public room in the area. Closing it saves little and takes it from the people with the fewest alternatives.", "A library is the cheapest service the council runs and the only one many residents touch weekly. The saving is small; what's lost is not."],
      tacticFlavour: "library",
      angles: ["Closure-clock human story: the people who use it on a Tuesday morning", "The numbers angle: what closure actually saves vs what the council spends elsewhere", "The legal angle: is the consultation adequate? (use carefully — escalation)", "Community offer angle: 'we asked to help run it — the council hasn't answered'"],
      creativeTactic: { name: "The 'Borrowed Futures' shelf count", desc: "a public, weekly-updated count of every book borrowed and every visit since the closure was announced — a running total on a board outside the library and online. Purpose: makes the service's use undeniable and gives media a repeatable number.", tech: "strengthens an old tactic (public evidence); survives without tech as a chalkboard" },
      digitalAsk: "email the consultation inbox and your ward councillors before the window closes"
    },
    schoolstreet: {
      kw: ["school street", "school-street", "school run", "traffic outside", "safer school"], asset: "the school street", kind: "transport / road safety",
      dmFormal: (a) => `${a}'s highways decision-makers (transport portfolio holder; orders signed by the director of highways/transport)`,
      committees: ["Executive / Cabinet (transport portfolio)", "Highways officers (statutory orders)", "Scrutiny (transport)"],
      process: "School streets run on experimental traffic orders (ETROs): the first 6 months of an ETRO is the statutory objection/support window, and written responses to the traffic team must be considered before permanent orders are made.",
      affected: ["families of pupils", "residents on the affected streets", "residents on boundary roads (displacement concerns)", "children walking and cycling"],
      pressures: [
        ["Internal / evidential", "officers need a defensible file: supportive representations on the statutory record beat noise"],
        ["Reputational", "'council abandons children's safety' if a working trial is dropped after visible support"],
        ["Financial (reframed)", "permanent camera/planter enforcement is cheaper than daily cones and marshals"],
        ["Electoral", "school-gate parents are organised, local, and remember"]
      ],
      mvwByAsk: { default: "supportive representations formally outnumber objections on the statutory record before the window closes — the council then cannot cite objection weight to drop the trial" },
      narrative: ["The street belongs to the children for twenty minutes a day — keep it that way.", "Parents asked, the council listened, the trial works. Finish the job."],
      tacticFlavour: "schoolstreet",
      angles: ["First-day-back photo moment at the gate", "'Will it survive?' — the decision-window story", "The cost angle: permanent design is cheaper than marshals"],
      creativeTactic: { name: "Street-by-street support thermometer", desc: "a laminated poster at the school gate plus a matching online counter showing support responses sent, street by street. Purpose: visible momentum inside the statutory window.", tech: "counter needs automation; poster survives without tech" },
      digitalAsk: "send a personalised support response to the council's traffic team before the window closes"
    },
    bus: {
      kw: ["bus", "route", "bus route", "service cut"], asset: "the bus route", kind: "public transport",
      dmFormal: () => "the transport authority (the operator commercially, the council/combined authority for supported services; TfL in London)",
      committees: ["Transport committee / combined authority board", "The operator's network planning team", "Traffic commissioner (registrations)"],
      process: "Commercial routes are the operator's decision with 70 days' registration notice; supported (subsidised) routes are the council's budget decision; in London TfL consults and decides. Identify which one this is first — it changes the whole campaign.",
      affected: ["passengers without cars — often older, younger, and lower-income residents", "people travelling to work, school, GP and hospital appointments", "local traders on the route"],
      pressures: [
        ["Financial / commercial", "operators respond to demonstrated demand and to reputational cost with the franchising authority"],
        ["Political", "councillors and MPs lobby operators and can fund supported services"],
        ["Reputational", "'cut off from the hospital' stories are strong and repeatable"],
        ["Procedural", "consultation windows and registration deadlines are hard levers"]
      ],
      mvwByAsk: { default: "a commitment to retain a minimum service level (peak + school + hospital journeys) while alternatives are assessed" },
      narrative: ["A bus route is a lifeline dressed as a timetable. Cut the route and you cut people off from work, school and the GP.", "The people on this route don't have a second option. That's why they're on the bus."],
      tacticFlavour: "bus",
      angles: ["Ride-along day: journalists ride the route with passengers who depend on it", "The 'last bus' countdown to the change date", "Data angle: who actually uses the route (ticket data ask)"],
      creativeTactic: { name: "The Route Diary", desc: "passengers log every journey and its purpose for two weeks — a public dataset of what the route actually carries (work, school, hospital). Purpose: demonstrated demand in the operator's own language.", tech: "a shared form + spreadsheet; survives on paper" },
      digitalAsk: "log your journeys in the route diary and email the consultation before the deadline"
    },
    planning: {
      kw: ["planning", "development", "data centre", "datacentre", "tower", "demolition", "redevelop"], asset: "the development site", kind: "planning and development",
      dmFormal: (a) => `${a}'s Planning Committee (councillors), advised by planning officers`,
      committees: ["Planning Committee", "Planning officers (recommendation)", "Secretary of State (call-in, rare)"],
      process: "Planning applications are decided by the planning committee against the local plan; only material planning considerations count (design, heritage, transport, amenity — not general dislike). Objections must arrive in the statutory consultation window, and committee dates are public.",
      affected: ["neighbouring residents and businesses", "heritage and conservation interests where relevant", "local traders", "future users of the site"],
      pressures: [
        ["Procedural / evidential", "material-consideration objections on the file are the only ones that legally count"],
        ["Political", "committee councillors are elected; visible, reasoned local opposition matters"],
        ["Reputational", "heritage and community-identity stories travel; developers fear delay"],
        ["Financial", "delay is expensive for applicants — a strong objection case changes their calculus"]
      ],
      mvwByAsk: { default: "the application is deferred at committee for further information, buying time to build the material case" },
      narrative: ["Nobody objects to investment. We object to the wrong building, in the wrong place, decided as if the neighbourhood weren't here.", "This decision is permanent. The consultation is six weeks. That asymmetry is why we're organising."],
      tacticFlavour: "planning",
      angles: ["What-it-replaces angle: the life of the site now", "The precedent angle: what gets approved here gets approved everywhere", "Committee-day set piece: residents' deputation"],
      creativeTactic: { name: "The Material Objection Clinic", desc: "drop-in sessions (and an online guide) where volunteers help neighbours turn 'I hate it' into material planning objections that legally count. Purpose: converts sentiment into file weight.", tech: "a guide + a table; the online version scales it" },
      digitalAsk: "submit a material objection on the planning portal before the window closes"
    },
    health: {
      kw: ["gp", "surgery", "pharmacy", "hospital", "clinic", "nhs", "health centre", "walk-in"], asset: "the service", kind: "health service change",
      dmFormal: () => "the NHS Integrated Care Board (ICB), with the provider trust",
      committees: ["ICB board (public papers)", "Council health Overview & Scrutiny Committee (referral power)", "The provider trust board"],
      process: "NHS service changes carry public-involvement duties; substantial variations trigger formal consultation, and the council's health scrutiny committee can refuse to accept a change and refer it upward. Those are the campaign's hard levers.",
      affected: ["registered patients — disproportionately older and chronically ill residents", "carers", "neighbouring practices absorbing displaced demand", "staff"],
      pressures: [
        ["Procedural", "scrutiny referral makes quiet closure impossible"],
        ["Reputational", "access-to-care stories are the strongest local stories that exist"],
        ["Internal NHS", "ICBs avoid contested reconfigurations that attract national attention"],
        ["Political", "MPs engage readily on NHS access; cross-party by default"]
      ],
      mvwByAsk: { default: "the change is paused pending a formal equality and access impact assessment, with scrutiny committee review" },
      narrative: ["Care you can reach is the whole point of primary care. Move it out of reach and it stops existing for the people who need it most.", "The consultation assumes everyone drives. The patients don't."],
      tacticFlavour: "health",
      angles: ["The journey test: how long the new journey takes by bus with a walking frame", "Scrutiny showdown: will councillors use their referral power?", "Patient-voices surgery-gate story"],
      creativeTactic: { name: "The Journey Test", desc: "volunteers time and film the real journey to the alternative service by public transport, at appointment times, with participants who actually make it. Purpose: turns 'access' from abstraction into evidence.", tech: "phones and a shared sheet; edits into media-ready clips" },
      digitalAsk: "respond to the NHS consultation and copy your councillor and MP"
    },
    leisure: {
      kw: ["leisure centre", "swimming pool", "pool", "sports centre", "playground", "park"], asset: "the facility", kind: "leisure / community facility",
      dmFormal: (a) => `${a}'s Cabinet (leisure/communities portfolio)`,
      committees: ["Cabinet", "Overview & Scrutiny (call-in)", "Full Council (budget)"],
      process: "Facility closures are executive budget decisions, usually consulted on, call-in-able by scrutiny, and sensitive to community-asset alternatives (community asset transfer, trust models).",
      affected: ["families and children (swimming lessons, clubs)", "older residents (health referrals, classes)", "local sports clubs", "staff"],
      pressures: [
        ["Reputational", "'council closes the pool' is a story with a long memory"],
        ["Public-health framing", "closure contradicts the council's own health strategies — internal contradiction is leverage"],
        ["Electoral", "facility users are concentrated, organised, and cross-party"],
        ["Financial (reframed)", "trust/community models keep facilities open elsewhere — closure is not the only saving"]
      ],
      mvwByAsk: { default: "a pause while community-operation options are formally assessed" },
      narrative: ["Every child in this town learned to swim here. The saving is real but small; what it buys is a town where they can't.", "The council's health strategy says 'get active'. Its budget says 'not here'."],
      tacticFlavour: "leisure",
      angles: ["Generations angle: three generations who learned to swim in one pool", "Health-strategy contradiction angle", "The community-offer angle"],
      creativeTactic: { name: "The Usage Wall", desc: "a public wall (physical + online) of photos and one-liners from users — every club, class and referral the facility hosts in one visible place. Purpose: makes 'underused' impossible to say.", tech: "a hashtag and a noticeboard; the online gallery scales it" },
      digitalAsk: "email the consultation and your ward councillors before the budget meeting"
    },
    generic: {
      kw: [], asset: "the decision", kind: "local public-policy decision",
      dmFormal: (a) => `${a}'s decision-makers (verify: executive/cabinet, a committee, or an external body)`,
      committees: ["Cabinet / Executive", "The relevant committee", "Overview & Scrutiny"],
      process: "First confirm who formally decides and through what process — executive decision, committee vote, or an external body — and when. The meeting, the office and the deadline are the campaign's skeleton.",
      affected: ["residents directly affected", "local groups and institutions connected to the issue"],
      pressures: [
        ["Reputational", "a clear, human local story that a decision-maker doesn't want attached to their name"],
        ["Electoral", "organised, concentrated local feeling ahead of the next elections"],
        ["Internal", "scrutiny, audit and members' own processes"],
        ["Procedural", "consultation windows and statutory duties around the decision"]
      ],
      mvwByAsk: { delay: "the decision is deferred while alternatives are formally assessed", reverse: "the item is withdrawn pending proper consultation", default: "a public commitment to review the decision with affected residents at the table" },
      narrative: ["Decisions made about a place work better when the people who live there are in the room. That's the whole campaign.", "We're not asking for the impossible. We're asking for the decision to be made properly, with us in it."],
      tacticFlavour: "generic",
      angles: ["The human-impact story", "The process story: how the decision was made", "The alternative story: what residents propose instead"],
      creativeTactic: { name: "The Alternatives Exhibition", desc: "a public display (community venue + online) of residents' costed alternatives to the decision. Purpose: reframes the campaign from 'against' to 'for', which decision-makers can join.", tech: "posters and a webpage; the format is copyable by any campaign" },
      digitalAsk: "write to the decision-makers before the deadline"
    }
  };

  /* ---------- parsing ---------- */
  function detectScenario(text) {
    const t = text.toLowerCase();
    for (const [id, sc] of Object.entries(SCENARIOS)) {
      if (id !== "generic" && sc.kw.some(k => t.includes(k))) return id;
    }
    return "generic";
  }

  function detectAsk(text) {
    const t = text.toLowerCase();
    if (/(reverse|scrap|cancel|withdraw|stop)/.test(t)) return "reverse";
    if (/(delay|pause|defer|postpone)/.test(t)) return "delay";
    if (/(permanent|keep|save|retain|protect)/.test(t)) return "keep";
    if (/(reinstate|restore|bring back)/.test(t)) return "restore";
    if (/(introduce|create|build|start)/.test(t)) return "introduce";
    return "change";
  }

  function detectDeadline(text) {
    const m = text.toLowerCase().match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s+(week|month|day)s?/);
    if (!m) return { weeks: 10, date: addWeeks(10), text: "an assumed ~10-week decision horizon", assumed: true };
    let n = WORDNUM[m[1]] || parseInt(m[1], 10);
    const weeks = m[2] === "month" ? n * 4 : m[2] === "day" ? Math.max(1, Math.round(n / 7)) : n;
    return { weeks, date: addWeeks(weeks), text: `${m[1]} ${m[2]}${n > 1 ? "s" : ""} from now`, assumed: false };
  }

  function detectAssetName(text, sc) {
    // e.g. "the local library", "Sunnybrook Library", "the number 43 bus"
    const properNoun = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})\s+(Library|Pool|Leisure Centre|Surgery|School|Park|Centre|Market)/);
    if (properNoun) return properNoun[0];
    const num = text.match(/(?:number\s+)?(\d{1,3}[A-Z]?)\s+bus|bus\s+(?:route\s+)?(\d{1,3}[A-Z]?)/i);
    if (num) return `the ${num[1] || num[2]} bus route`;
    return sc.asset;
  }

  const ASK_VERB = {
    reverse: "withdraw the decision", delay: "defer the decision pending a genuine options appraisal",
    keep: "make the current provision permanent", restore: "reinstate the service", introduce: "commit to the proposal", change: "change course"
  };

  /* ---------- the shared campaign object ---------- */
  function build(input) {
    const problem = (input.problem || "").trim();
    const seed = hash(problem + (input.location || ""));
    const scId = detectScenario(problem);
    const sc = SCENARIOS[scId];
    const ask = detectAsk(problem);
    const deadline = detectDeadline(problem);
    const lookup = window.CF_ADAPTERS.electoral.lookup((input.location || "") + " " + problem);
    const authority = lookup.data || { name: "your local authority", type: "local authority", area: input.location || "your area", governance: "verify: cabinet, committee or mayoral system", mediaKey: "generic", placeholder: true };
    const asset = detectAssetName(problem, sc);
    const dm = sc.dmFormal(authority.name);
    const mvw = sc.mvwByAsk[ask] || sc.mvwByAsk.default;
    const decisionDateText = deadline.assumed ? `${fmtDate(deadline.date)} (assumed — verify the real date)` : fmtDate(deadline.date);
    const org = (input.org || "").trim() || "the campaign";
    const media = window.CF_ADAPTERS.media.outlets(authority.mediaKey);

    const noun = asset.replace(/^the (local )?/, "");
    const name = pick([
      `${ask === "keep" ? "Keep" : ask === "restore" ? "Bring Back" : "Save"} Our ${cap(noun)}`,
      `${cap(noun)} Matters`,
      `Hands Off Our ${cap(noun)}`
    ], seed, 1);

    const c = {
      generatedAt: new Date(),
      input: { problem, org: input.org || "", location: input.location || "" },
      name, scenario: scId, kind: sc.kind,
      authority, asset, ask, deadline, decisionDateText,
      affected: sc.affected,
      evidence: [
        { text: problem, status: "user", label: "Your description" },
        { text: `${authority.name} — ${authority.type}${authority.governance ? " · " + authority.governance : ""}`, status: authority.placeholder ? "ext" : "real", label: authority.placeholder ? "External source required" : "Preloaded public data" },
        { text: sc.process, status: "gen", label: "Generated analysis — verify against the specific case" }
      ],
      unknowns: [
        "the exact decision date, meeting and agenda item " + (deadline.assumed ? "(no date detected in your description)" : "(confirm the date you gave against the published forward plan)"),
        "the named portfolio holder / committee chair (from the council website)",
        "what consultation has already run and what it found",
        "who is organising on the other side, if anyone",
        "what the decision actually saves or costs (the officer report will say)"
      ],
      assumptions: [
        `the decision has not yet been formally made (if it has, the campaign becomes a reversal campaign — harder, different levers)`,
        `${dm.split("(")[0].trim()} is the right target — verify who formally decides`,
        "affected residents are willing to act if asked directly"
      ],
      objective: {
        formula: { dm, action: `${ASK_VERB[ask]} on ${asset}`, by: decisionDateText, mvw },
        smart: [
          ["Specific", `names the decision (${asset}), the decision-maker and the action`, true],
          ["Measurable", "success = the decision itself; progress = representations filed, meetings secured, positions moved", true],
          ["Achievable", `local decisions reverse when visible, organised, procedurally-grounded opposition raises their cost — scale matched to ${deadline.weeks} weeks`, true],
          ["Relevant", "directly serves the people affected; builds durable local capacity either way", true],
          ["Time-bound", `hard deadline: ${decisionDateText}`, true]
        ]
      },
      decisionMakers: { formal: dm, committees: sc.committees, process: sc.process,
        practical: "Officers write the report and the recommendation; the portfolio holder carries it; scrutiny can call it in. Win the report if you can, the politics if you must." },
      pressures: sc.pressures,
      statusQuoCost: "The campaign succeeds when proceeding unchanged is more expensive — in reputation, procedure, politics or money — than the change we're asking for. Every tactic below exists to raise that cost or lower the cost of saying yes.",
      stakeholders: buildStakeholders(sc, authority, asset, scId),
      strategy: {
        narrative: pick(sc.narrative, seed, 2),
        audiences: ["directly affected residents/users", "the wider neighbourhood", "ward councillors (all parties)", "local media"],
        route: "Inside track first (officers and portfolio holder — give them a low-cost way to say yes), statutory/consultation channel always (it's the record that counts), public pressure held in reserve as escalation.",
        phases: buildPhases(deadline.weeks),
        constraints: ["small core team and no assumed budget", "volunteer time is the main resource", `${deadline.weeks} weeks to the decision`],
        avoid: ["personal attacks on officers or councillors — the target is the decision", "template-identical mass emails (they get bundled and discounted)", "claims that outrun the evidence — one wrong number costs the file", "tactics that assume resources the campaign doesn't have"],
        escalation: "If the inside track stalls: scrutiny call-in request → public petition presented at Full Council → media accountability angle → (where grounds exist) pre-action legal letter on consultation adequacy.",
        indicators: ["meetings secured with decision-makers", "representations on the statutory record", "councillors publicly positioned", "media coverage in target outlets", "volunteer roles filled"]
      },
      tactics: buildTactics(sc, deadline.weeks, asset, authority),
      organising: buildOrganising(sc, asset),
      media: { outlets: media.data, angles: sc.angles,
        headline: pick([`Decision day looms for ${asset.replace(/^the /, "")}: campaigners demand ${ask === "delay" ? "a pause" : "a rethink"}`, `'${pick(sc.narrative, seed, 3).split(".")[0]}': residents organise over ${asset.replace(/^the /, "")}`], seed, 4) },
      digital: { ask: sc.digitalAsk },
      creativeTactic: sc.creativeTactic,
      metrics: {
        campaign: ["decision outcome vs minimum viable win", "representations/objections filed (weekly count)", "meetings with decision-makers held", "councillors publicly supportive", "coverage in target outlets"],
        organising: ["volunteers active this week", "supporters moved up a ladder rung", "one-to-ones held", "new coalition partners"],
        refuse: ["posts generated", "emails drafted", "any measure of output volume"]
      },
      risks: [
        "the decision is made earlier than expected — verify the forward plan this week",
        "counter-mobilisation fills the same consultation channel",
        "a factual error in campaign materials discredits the file",
        "burnout of the small core team — the organising plan is the mitigation"
      ],
      provenance: {
        real: ["local authority name/type" + (authority.placeholder ? " (not matched — enter a recognised place for preloaded data)" : ""), "media outlet names", "institutional processes described generically"],
        generated: ["objective, strategy, tactics, organising plan and all drafts — simulated analysis applying the workshop framework"],
        mock: ["journalist contact roles", "any named meeting dates"],
        needed: ["officeholder names", "actual meeting dates", "consultation status", "local usage/impact data"]
      }
    };
    return c;
  }

  function buildStakeholders(sc, authority, asset, scId) {
    const S = [];
    const ph = { position: "placeholder", note: "External source required — name from the council/body website" };
    S.push({ name: sc.dmFormal(authority.name).replace(/\(.*\)/, "").trim(), role: "Primary decision-maker", tier: "decides", power: "High", position: "Unknown until engaged", status: "verify", motivation: "a defensible decision at acceptable political cost", askOf: "meet the campaign; state the decision criteria; " + (scId === "planning" ? "defer pending information" : "pause pending options"), approach: "formal meeting request via the office; officers first", confidence: "—" });
    S.push({ name: "Lead officer for the service area", role: "Writes the report and recommendation", tier: "decides", power: "High", position: "Neutral-professional", status: "verify", motivation: "an evidenced file; low legal and audit risk", askOf: "include the campaign's evidence and alternatives in the report", approach: "polite, evidenced, early — officers remember who was reasonable", confidence: "Medium (role-based inference)" });
    S.push({ name: "Ward councillors (all parties, affected wards)", role: "Elected local voice", tier: "influences", power: "Medium", position: "Winnable", status: "verify", motivation: "visible service to constituents; re-election", askOf: "public support; a joint cross-party letter; scrutiny call-in if needed", approach: "constituents ask, not the organisation — bring residents to the surgery", confidence: "Medium" });
    S.push({ name: "Overview & Scrutiny members", role: "Call-in / referral power", tier: "influences", power: "Medium-High", position: "Procedural, persuadable", status: "verify", motivation: "scrutiny done properly; cross-party credibility", askOf: "call the decision in for examination", approach: "brief the chair with the strongest procedural points only", confidence: "Medium" });
    S.push({ name: "The local MP", role: "Constituency voice (no formal power here)", tier: "influences", power: "Low-Medium", position: "Unknown", status: "verify", motivation: "constituent visibility", askOf: "one supportive letter; a mention where useful — nothing more", approach: "constituents write; keep expectations low", confidence: "Low" });
    S.push({ name: "Directly affected users of " + asset, role: "The campaign's base", tier: "mobilises", power: "High (collectively)", position: "Supportive", status: "gen", motivation: "keeping what they use and need", askOf: "one personalised representation each; one friend recruited", approach: "face-to-face where they already are", confidence: "High" });
    S.push({ name: "Local community organisations, faith groups, schools nearby", role: "Trusted networks", tier: "mobilises", power: "Medium", position: "Potential allies", status: "gen", motivation: "their members are affected", askOf: "a supportive statement; sharing the action with members", approach: "one named liaison per organisation; specific, small asks", confidence: "Medium" });
    S.push({ name: "Local press and BBC local radio", role: "Amplifier", tier: "influences", power: "Medium", position: "Neutral, story-hungry", status: "real", motivation: "a strong local story with pictures and people", askOf: "cover the decision as a live local question", approach: "one pitch, one photo moment, real voices (see Media Pack)", confidence: "High" });
    S.push({ name: "Those who benefit from the decision (or from the savings)", role: "Opponents / blockers", tier: "resists", power: "Varies", position: "Opposed or indifferent", status: "gen", motivation: "budget pressure; competing priorities; sometimes a competing project", askOf: "—", approach: "map them honestly; never misrepresent their case — rebut the strongest version", confidence: "Low" });
    return S;
  }

  function buildPhases(weeks) {
    const w = Math.max(3, weeks);
    const p1 = Math.max(1, Math.round(w * 0.25)), p2 = Math.max(1, Math.round(w * 0.3)), p3 = Math.max(1, Math.round(w * 0.3));
    return [
      { name: "Foundation", weeks: `Weeks 1–${p1}`, focus: "verify facts, meet officers, recruit the core team" },
      { name: "Public proof", weeks: `Weeks ${p1 + 1}–${p1 + p2}`, focus: "the story goes public; the evidence base becomes visible" },
      { name: "Mobilisation", weeks: `Weeks ${p1 + p2 + 1}–${p1 + p2 + p3}`, focus: "representations at scale into the formal channel" },
      { name: "Endgame", weeks: `Final weeks to decision day`, focus: "close the argument with decision-makers; escalate only if needed" }
    ];
  }

  function buildTactics(sc, weeks, asset, authority) {
    return [
      { phase: 1, name: "Verify the decision path", type: "foundation", purpose: "confirm who decides, when, and through what process — the plan's skeleton", target: "council forward plan / committee calendar", owner: "core team (2 people, half a day)", pressure: "none — accuracy", timing: "week 1", success: "named meeting, named decision-maker, confirmed date", next: "book the officer meeting", escalation: "—", approval: "internal" },
      { phase: 1, name: "Officer meeting, then portfolio holder", type: "lobbying", purpose: "learn the decision criteria; put alternatives on the record early", target: "lead officer → portfolio holder", owner: "2 campaign reps + one directly affected resident", pressure: "internal/evidential", timing: "weeks 1–3", success: "campaign evidence acknowledged in the officer report", next: "co-design timing of public asks", escalation: "if refused twice → scrutiny chair briefing", approval: "external — humans attend and speak" },
      { phase: 2, name: "Launch story with photo moment", type: "media", purpose: "set the public frame before opponents or the council do", target: "the local daily + BBC local radio", owner: "media lead + 2-3 real affected voices", pressure: "reputational", timing: "start of phase 2", success: "one substantial piece in a target outlet", next: "bank the coverage for the endgame", escalation: "—", approval: "external — press release and quotes approved; consent from everyone named" },
      { phase: 2, name: sc.creativeTactic.name, type: "creative", purpose: sc.creativeTactic.desc, target: "public opinion + decision-makers' sense of visibility", owner: "volunteers", pressure: "reputational/evidential", timing: "phase 2 onward, updated weekly", success: "referenced by media or councillors", next: "keep it running to decision day", escalation: "—", approval: "internal — content checked before display" },
      { phase: 3, name: "Personalised representations at scale", type: "mobilisation", purpose: "fill the formal channel with individual, personal, material responses — the record that decision-makers must weigh", target: "the consultation inbox / committee correspondence", owner: "every supporter, via captains' one-to-ones", pressure: "procedural + political", timing: "phase 3, three pushes", success: "representations visibly outnumber opposition; personal, non-template content", next: "publicise the tally to decision-makers", escalation: "—", approval: "never auto-sent — every message is a person's own" },
      { phase: 3, name: "Cross-party councillor letter", type: "lobbying", purpose: "cover, not confrontation — make support safe for the decision-maker", target: "ward councillors, all parties", owner: "campaign brokers; councillors author and sign", pressure: "political", timing: "mid phase 3", success: "letter with signatures from 2+ parties", next: "portfolio holder carries it inward", escalation: "if no signatures → community organisations' joint letter instead", approval: "external — humans sign" },
      { phase: 4, name: "Decision-day presence", type: "mobilisation", purpose: "the decision is taken in front of the people it affects", target: "the deciding meeting (public gallery + deputation slot if the constitution allows)", owner: "as many supporters as the room holds; 1 speaker", pressure: "political/reputational", timing: "decision day", success: "deputation heard; gallery full; respectful throughout", next: "win: thank publicly · lose: announce next step same day", escalation: "—", approval: "external — speaker and text approved" },
      { phase: 4, name: "Escalation (held in reserve)", type: "escalation", purpose: "raise the cost of a bad decision only if the inside track fails", target: "scrutiny call-in; petition to Full Council; (where grounds exist) pre-action letter on consultation adequacy", owner: "core team decision, not automatic", pressure: "procedural/legal", timing: "only on trigger at the phase-3 review", success: "decision re-opened", next: "return to the inside track with more leverage", escalation: "—", approval: "external + core-team sign-off — never fires on a schedule" }
    ];
  }

  function buildOrganising(sc, asset) {
    return {
      whoActs: "the people who use and live near " + asset + " — the campaign works only if they own it, not receive it",
      asks: ["one personalised representation (3 minutes)", "one friend brought in", "one visible act of support (poster, photo, meeting attendance)"],
      roles: [
        ["Captains", "one per street / class / user-group; makes the face-to-face asks where people already are"],
        ["Response-party hosts", "kitchen-table or community-room sessions where people write representations together"],
        ["Coalition liaison", "single named contact for each allied organisation"],
        ["Media voices", "2–3 affected people willing to be quoted and photographed (with consent)"]
      ],
      ladder: [
        ["Interested", "signs up in person or via the group chat"],
        ["Informed", "reads the one-page briefing: the decision, the date, why responses count"],
        ["First action", "sends their personalised representation"],
        ["Shows up", "attends a response party or the public meeting"],
        ["Recruits", "brings one named friend in"],
        ["Organiser", "takes a role above"]
      ],
      oneToOne: ["their story — what the issue means to them, in their words", "the stakes — the decision, the date, what silence means", "the ask — one rung, this week", "hesitation — listen, don't rebut", "commitment — named action, named date, agreed follow-up"],
      event: "one public meeting at a trusted venue, mid-campaign: 45 minutes, three real voices, one clear ask, sign-up sheets at the door — plus response parties weekly in phase 3",
      channels: ["existing WhatsApp/Facebook groups (via trusted members, not broadcast)", "notice boards and shop windows", "the venue itself — the campaign should be visible at " + asset, "a simple sign-up form"],
      followup: "every sign-up gets a named person's follow-up within a week — a message from a human, not a newsletter",
      sustain: "small visible wins weekly (the counter, the coverage, the signatures); credit shared publicly; asks kept small and specific; the retro after each phase asks what to stop, keep, try",
      metrics: ["active volunteers this week", "one-to-ones held", "supporters moved up a rung", "% of representations that are personal, not template"]
    };
  }

  window.CF_ENGINE = { build, SCENARIOS, fmtDate };
})();
