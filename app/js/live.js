/* Live campaign generation — browser-direct calls to the Claude API.
   Three calls: A) research with the web_search server tool, B) campaign plan
   (structured output), C) drafted resources (structured output) — all merged
   into the ONE shared campaign object the journey and documents read from.

   Raw fetch (this is a zero-dependency static app; no bundler for the SDK).
   Model: claude-opus-4-8. Verification labels are enforced by schema enum.
   Fallback ladder: any failed call → presenter-visible retry → continue with
   the simulated baseline for that stage, clearly labelled. Never invents facts. */

(function () {
  const DIRECT = "https://api.anthropic.com";
  const PROXY = "http://localhost:8787";
  const MODEL = "claude-opus-4-8";
  // Served from the proxy (http://localhost:8787)? Same origin — use relative
  // paths and every browser policy problem (CORS, private-network) disappears.
  const SAME_ORIGIN = location.protocol.startsWith("http");
  let apiBase = SAME_ORIGIN ? "" : (localStorage.getItem("cf_api_base") || DIRECT);
  const API = () => apiBase + "/v1/messages";

  /* Orgs can disable browser (CORS) requests in Console settings. When that exact
     401 appears and the local proxy (node app/proxy.js) is running, switch to it
     automatically and retry — the key is injected server-side by the proxy. */
  async function proxyAvailable() {
    try { const r = await fetch(PROXY + "/health", { signal: AbortSignal.timeout(1500) }); const j = await r.json(); return !!(j && j.ok); }
    catch (e) { return false; }
  }
  const STATUSES = ["Verified public information", "Supported inference", "Generated campaign recommendation", "Campaign assumption", "Conflicting evidence", "Verification incomplete", "External information unavailable"];

  const getKey = () => localStorage.getItem("cf_api_key") || window.CF_LOCAL_KEY || "";
  const setKey = (k) => localStorage.setItem("cf_api_key", (k || "").trim());
  const configured = () => getKey().length > 10;

  function headers() {
    return {
      "content-type": "application/json",
      "x-api-key": getKey(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    };
  }

  /* Streaming call: long requests must stream — a non-streaming response sends
     nothing until complete, and idle connections get killed by Node fetch (~5 min)
     and by conference-grade networks. Accumulates SSE events back into a
     { content, stop_reason } shape equivalent to the non-streaming response. */
  async function call(body, timeoutMs, onProgress) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs || 120000);
    // inactivity watchdog: a streaming response should deliver bytes continuously;
    // 90s of silence means the connection died quietly — abort fast so the retry
    // ladder can act, instead of hanging until the overall ceiling.
    let lastData = Date.now();
    const wd = setInterval(() => { if (Date.now() - lastData > 90000) ctrl.abort(); }, 5000);
    try {
      let res = await fetch(API(), { method: "POST", headers: headers(), body: JSON.stringify({ ...body, stream: true }), signal: ctrl.signal });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err.error && err.error.message) || res.statusText;
        if (res.status === 401 && /CORS/i.test(msg) && apiBase === DIRECT && await proxyAvailable()) {
          apiBase = PROXY;
          localStorage.setItem("cf_api_base", PROXY);
          if (onProgress) onProgress("browser requests blocked by org settings — switched to local proxy");
          res = await fetch(API(), { method: "POST", headers: headers(), body: JSON.stringify({ ...body, stream: true }), signal: ctrl.signal });
          if (!res.ok) { const e2 = await res.json().catch(() => ({})); throw new Error(`API ${res.status}: ${(e2.error && e2.error.message) || res.statusText}`); }
        } else {
          throw new Error(`API ${res.status}: ${msg}${/CORS/i.test(msg) ? " — run `node app/proxy.js` and retry, or enable browser access in your org's Console settings." : ""}`);
        }
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", stop_reason = null;
      const content = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lastData = Date.now();
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          let ev; try { ev = JSON.parse(line.slice(5).trim()); } catch (e) { continue; }
          if (ev.type === "content_block_start") {
            const blk = JSON.parse(JSON.stringify(ev.content_block));
            blk.__json = "";
            content[ev.index] = blk;
            if (onProgress && blk.type === "server_tool_use") onProgress("searching the web…");
            if (onProgress && blk.type === "web_search_tool_result") onProgress("reading search results…");
            if (onProgress && blk.type === "text") onProgress("writing up findings…");
          } else if (ev.type === "content_block_delta") {
            const c = content[ev.index]; if (!c) continue;
            if (ev.delta.type === "text_delta") c.text = (c.text || "") + ev.delta.text;
            else if (ev.delta.type === "thinking_delta") c.thinking = (c.thinking || "") + ev.delta.thinking;
            else if (ev.delta.type === "input_json_delta") c.__json += ev.delta.partial_json;
          } else if (ev.type === "content_block_stop") {
            const c = content[ev.index];
            if (c) { if (c.__json) { try { c.input = JSON.parse(c.__json); } catch (e) { } } delete c.__json; }
          } else if (ev.type === "message_delta") {
            if (ev.delta && ev.delta.stop_reason) stop_reason = ev.delta.stop_reason;
          } else if (ev.type === "error") {
            throw new Error("API stream error: " + ((ev.error && ev.error.message) || "unknown"));
          }
        }
      }
      return { content: content.filter(Boolean), stop_reason };
    } finally { clearTimeout(t); clearInterval(wd); }
  }

  const textOf = (resp) => (resp.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");

  function parseJSON(text) {
    try { return JSON.parse(text); } catch (e) { /* tolerant extraction */ }
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    if (start >= 0 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch (e) { } }
    throw new Error("Could not parse JSON from model response");
  }

  /* ---------- deterministic live lookup (keyless, CORS-enabled) ---------- */
  async function postcodeLookup(location) {
    const m = (location || "").toUpperCase().match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/);
    if (!m) return null;
    try {
      const r = await fetch("https://api.postcodes.io/postcodes/" + encodeURIComponent(m[0].replace(/\s/g, "")), { signal: AbortSignal.timeout(6000) });
      if (!r.ok) return null;
      const j = await r.json();
      const d = j.result;
      return {
        claim: `${m[0]} → ward ${d.admin_ward}, constituency ${d.parliamentary_constituency}, local authority ${d.admin_district}`,
        status: "Verified public information", sourceTitle: "postcodes.io postcode lookup",
        sourceOrg: "postcodes.io (ONS data)", url: "https://api.postcodes.io", date: "",
        accessDate: new Date().toISOString().slice(0, 10),
        evidence: `admin_ward=${d.admin_ward}; constituency=${d.parliamentary_constituency}; district=${d.admin_district}`,
        confidence: "High", usedFor: "Researched context; Power & Stakeholder Map",
        data: d
      };
    } catch (e) { return null; }
  }

  /* ---------- Call A: research with web search ---------- */
  const RESEARCH_SYSTEM = `You are the research stage of Campaign Factory, a UK local and public-policy campaign-planning system. Your job: establish the verifiable facts behind a campaign problem using web search of authoritative sources (official council/public-body sites, gov.uk, parliament.uk, TfL/GLA, regulators, reputable local journalism). UK context only.

Rules — non-negotiable:
- NEVER invent quotations, policies, political positions, contact details, meeting dates, stakeholder relationships, organisational responsibilities, journalist names, or public statements.
- Every claim gets a verification status from exactly this set: ${STATUSES.map(s => `"${s}"`).join(", ")}.
- If you cannot verify something, record what you searched and mark it "Verification incomplete" or "External information unavailable" — do not guess.
- Prefer inspecting the underlying page over trusting a search snippet.
- Names of current officeholders: include ONLY if found on an official or authoritative page during this research, with the source; otherwise describe the role and mark "Verification incomplete".
- BE DECISIVE — this runs live on stage with a hard time budget. Run at most 4 searches, prioritised: (1) who owns/decides this, (2) the current policy or restriction, (3) the process/deadline, (4) one precedent or opposition check. Then STOP searching and write the JSON. 8–14 well-sourced claims beat exhaustive coverage; put anything you didn't reach in unresolvedQuestions rather than searching further.

Return ONLY a JSON object (no prose before or after) with this shape:
{"refinedProblem": string, "campaignName": string (short, campaign-style), "location": {"area": string, "authority": string, "geography": string},
 "interpretation": string (what the user is actually asking, 2-3 sentences),
 "missingInfo": [string], "researchQuestions": [string],
 "context": {"situation": string (verified description), "currentPolicy": string, "affected": [string], "keyDates": [string], "institutions": [string], "howItChanged": string (how research refined the original request)},
 "decisionMaker": {"formal": string, "implementer": string, "practical": string, "processes": [string], "interventionPoints": [string], "deadlines": [string], "unresolved": [string]},
 "claims": [{"claim": string, "status": string (from the set above), "sourceTitle": string, "sourceOrg": string, "url": string, "date": string, "accessDate": string, "evidence": string (short supporting excerpt/paraphrase), "confidence": "High"|"Medium"|"Low", "usedFor": string}],
 "possibleAllies": [string], "possibleOpponents": [string], "localMedia": [string],
 "searched": [string], "unresolvedQuestions": [string]}`;

  async function researchCall(input, hooks) {
    let messages = [{
      role: "user",
      content: `Campaign problem (verbatim from the user):\n"""${input.problem}"""\n\nOptional structured input: organisation=${input.org || "—"}; location=${input.location || "—"}; desired outcome=${input.outcome || "—"}; known decision-maker=${input.dm || "—"}; timeframe=${input.timeframe || "—"}; affected=${input.affected || "—"}; known evidence/context=${input.evidence || "—"}; available resources=${input.resources || "—"}.\n\nToday's date: ${new Date().toDateString()}. Research this now and return the JSON.`
    }];
    const body = {
      model: MODEL, max_tokens: 8000,
      system: RESEARCH_SYSTEM,
      output_config: { effort: "medium" },   // decisive research, not exhaustive — stage time budget
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }],
      messages
    };
    const prog = hooks && hooks.onNote ? (t) => hooks.onNote(t) : null;
    let resp = await call(body, 600000, prog);   // streaming; generous ceiling
    // server-tool loop can pause; resume by appending the assistant turn (max 3 resumes)
    for (let i = 0; i < 3 && resp.stop_reason === "pause_turn"; i++) {
      messages = [...messages, { role: "assistant", content: resp.content }];
      resp = await call({ ...body, messages }, 600000, prog);
    }
    if (resp.stop_reason === "refusal") throw new Error("The request was declined by the model's safety systems.");
    const out = parseJSON(textOf(resp));
    if (hooks && hooks.onSources) hooks.onSources(out.claims || []);
    return out;
  }

  /* ---------- Call B: campaign plan (structured output) ---------- */
  const S = (props, req) => ({ type: "object", properties: props, required: req || Object.keys(props), additionalProperties: false });
  const A = (items) => ({ type: "array", items });
  const str = { type: "string" };
  const strA = A(str);

  const PLAN_SCHEMA = S({
    objective: S({ dm: str, action: str, by: str, mvw: str, success: str, constraints: strA, smart: A(S({ test: str, assessment: str })) }),
    stakeholders: A(S({
      name: str, org: str, role: str,
      tier: { type: "string", enum: ["decides", "influences", "mobilises", "resists", "neutral"] },
      power: { type: "string", enum: ["High", "Medium-High", "Medium", "Low-Medium", "Low"] },
      position: str, positionStatus: { type: "string", enum: STATUSES },
      relationship: str, cares: str, ask: str, approach: str, evidence: str, confidence: { type: "string", enum: ["High", "Medium", "Low"] }
    })),
    pressures: A(S({ type: str, on: str, why: str, whoApplies: str, channel: str, evidence: str, action: str })),
    statusQuoCost: str,
    strategy: S({
      narrative: str, audiences: strA, route: str, coalition: str,
      phases: A(S({ name: str, when: str, focus: str })),
      resources: strA, constraints: strA, risks: strA, tradeoffs: strA, escalation: str, avoid: strA, indicators: strA
    }),
    tactics: A(S({
      name: str, phase: { type: "integer" }, type: str, purpose: str, target: str, owner: str, pressure: str,
      resources: str, timing: str, dependencies: str, expected: str, success: str, next: str, escalation: str,
      approval: str
    })),
    organising: S({
      whoActs: str, whyParticipate: str, asks: strA,
      roles: A(S({ role: str, what: str })),
      coalition: strA, oneToOne: strA, outreach: str, event: str,
      ladder: A(S({ rung: str, action: str })),
      channels: strA, followup: str, sustain: str, metrics: strA, humanEssential: strA
    }),
    risks: strA, assumptions: strA,
    metrics: S({ campaign: strA, organising: strA }),
    qualityFlags: strA
  });

  const PLAN_SYSTEM = `You are the strategy stage of Campaign Factory. Apply this campaign-planning framework, in order: objective (formula: "We want [decision-maker] to [specific action] by [time], even if the immediate outcome is only [minimum viable win]"; SMART; minimum viable win; theory of change) → decision-makers and route → power & stakeholder mapping → pressure analysis (what makes the status quo costlier than change, for THIS decision-maker) → strategy → sequenced tactics with escalation conditions and human approval points → organising people (ladder of engagement, relational organising, one-to-ones, coalition).

Rules:
- Be specific to the researched place, institutions, and decision. Reject generic advice; every tactic must name its target, owner, purpose and success sign.
- Do not retain the user's original framing if research shows a different institution or decision is responsible.
- Stakeholder positions must carry an honest verification status; never present an inferred opinion as confirmed. Use role descriptions where officeholder names were not verified.
- 8-12 stakeholders, 4-6 pressures, 4 phases, 7-9 tactics (conventional + creative + tech-enabled; private engagement before public pressure unless research says otherwise), and a complete organising plan.
- No escalation fires automatically: every escalation condition is a human decision at a review point.
- qualityFlags: list anything in your own plan that a campaign-specificity review should question (unnamed decision-makers, assumptions, generic elements).`;

  /* The plan schema is too large for structured-output grammar compilation
     (verified against the live API), so this call uses prompt-specified JSON
     with tolerant parsing and one automatic corrective retry. */
  async function planCall(input, research) {
    const ask = `User input: ${JSON.stringify(input)}\n\nResearch findings (verified):\n${JSON.stringify(research)}\n\nReturn ONLY a JSON object (no prose, no code fences) that validates against this JSON Schema:\n${JSON.stringify(PLAN_SCHEMA)}`;
    let messages = [{ role: "user", content: ask }];
    for (let attempt = 0; ; attempt++) {
      const resp = await call({ model: MODEL, max_tokens: 16000, system: PLAN_SYSTEM, messages }, 240000);
      if (resp.stop_reason === "refusal") throw new Error("Plan generation was declined.");
      try { return parseJSON(textOf(resp)); }
      catch (e) {
        if (attempt >= 1) throw e;
        messages = [...messages, { role: "assistant", content: resp.content }, { role: "user", content: "That was not parseable as a single JSON object. Return ONLY the complete JSON object, nothing else." }];
      }
    }
  }

  /* ---------- Call C: drafted resources (structured output) ---------- */
  const QA = A(S({ q: str, a: str }));
  const DRAFTS_SCHEMA = S({
    lobbying: S({ briefing: str, meetingEmail: str, agenda: str, keyArguments: strA, talkingPoints: strA, questionsToAsk: strA, objections: A(S({ objection: str, response: str })), contactScript: str, doorknockScript: str, followupEmail: str, escalationOptions: strA }),
    media: S({ pressRelease: str, pitchEmail: str, headline: str, altAngles: strA, spokespeople: str, quotes: A(S({ voice: str, quote: str, note: str })), qa: QA, hostileQA: QA, timing: str, visual: str }),
    digital: S({ landingCopy: str, actionPageCopy: str, supporterEmail: str, volunteerMessage: str, socialPosts: A(S({ platform: str, text: str })), audienceVariants: A(S({ audience: str, text: str })), faq: QA, ctas: strA, contentSequence: str, sharingMessage: str, graphicConcepts: strA })
  });

  const DRAFTS_SYSTEM = `You are the production stage of Campaign Factory. Draft complete, usable first-draft campaign materials from the shared campaign plan. Every draft must: name the specific place and issue; target a specific audience; serve the strategy; carry the right call to action; use ONLY verified facts from the research (cite the fact inline in plain language, e.g. "the council's own consultation found...").
Mark anything unverified in square brackets: "[VERIFY: ...]" — never present an unverified figure, name, date or statement as fact. Quotes are DRAFTS for real people to adapt: attribute them to a role ("campaign spokesperson", "a parent"), never to a named real person. Do not invent journalist names or contact details. Write in plain UK English, no marketing filler.`;

  async function draftsCall(input, research, plan) {
    const resp = await call({
      model: MODEL, max_tokens: 16000,
      system: DRAFTS_SYSTEM,
      output_config: { format: { type: "json_schema", schema: DRAFTS_SCHEMA } },
      messages: [{ role: "user", content: `Campaign plan:\n${JSON.stringify(plan)}\n\nKey verified facts:\n${JSON.stringify((research.claims || []).slice(0, 20))}\n\nUser context: ${JSON.stringify(input)}\n\nDraft the resources JSON.` }]
    }, 150000);
    if (resp.stop_reason === "refusal") throw new Error("Drafting was declined.");
    return parseJSON(textOf(resp));
  }

  /* ---------- merge live results into the shared campaign object ---------- */
  function mergeResearch(c, r, pcClaim) {
    c.live = c.live || {};
    c.live.research = r;
    c.sources = [...(pcClaim ? [pcClaim] : []), ...(r.claims || [])];
    if (r.campaignName) c.name = r.campaignName;
    if (r.refinedProblem) c.refinedProblem = r.refinedProblem;
    c.interpretation = r.interpretation;
    if (r.location && r.location.authority) c.authority = { ...c.authority, name: r.location.authority, area: r.location.area || c.authority.area, placeholder: false, live: true };
    if (r.context) {
      c.affected = r.context.affected && r.context.affected.length ? r.context.affected : c.affected;
      c.contextLive = r.context;
    }
    if (r.decisionMaker && r.decisionMaker.formal) {
      c.decisionMakers = { ...c.decisionMakers, formal: r.decisionMaker.formal, practical: r.decisionMaker.practical || c.decisionMakers.practical, committees: r.decisionMaker.processes || c.decisionMakers.committees, process: (r.decisionMaker.processes || []).join(" · ") || c.decisionMakers.process, implementer: r.decisionMaker.implementer, interventionPoints: r.decisionMaker.interventionPoints, deadlines: r.decisionMaker.deadlines, unresolved: r.decisionMaker.unresolved };
    }
    c.unknowns = (r.missingInfo && r.missingInfo.length ? r.missingInfo : c.unknowns).concat(r.unresolvedQuestions || []);
    c.mediaLive = r.localMedia || [];
    c.searched = r.searched || [];
  }

  function mergePlan(c, p) {
    c.live = c.live || {};
    c.live.plan = p;
    if (p.objective) {
      c.objective = { formula: { dm: p.objective.dm, action: p.objective.action, by: p.objective.by, mvw: p.objective.mvw }, smart: (p.objective.smart || []).map(s => [s.test, s.assessment]), success: p.objective.success, constraints: p.objective.constraints };
      // if research couldn't establish the decision route, the plan's decision-maker
      // is still better than the baseline guess — backfill, labelled as inference
      if (c.researchUnavailable) c.decisionMakers = { ...c.decisionMakers, formal: p.objective.dm };
    }
    if (p.stakeholders && p.stakeholders.length) c.stakeholders = p.stakeholders.map(s => ({ ...s, askOf: s.ask, motivation: s.cares, status: s.positionStatus }));
    if (p.pressures && p.pressures.length) c.pressures = p.pressures.map(x => [x.type, `${x.why} — applied by ${x.whoApplies} via ${x.channel}. Activation: ${x.action}`]);
    c.pressuresLive = p.pressures;
    if (p.statusQuoCost) c.statusQuoCost = p.statusQuoCost;
    if (p.strategy) c.strategy = { ...c.strategy, ...p.strategy, phases: p.strategy.phases && p.strategy.phases.length ? p.strategy.phases.map(ph => ({ name: ph.name, weeks: ph.when, focus: ph.focus })) : c.strategy.phases };
    if (p.tactics && p.tactics.length) c.tactics = p.tactics.map(t => ({ ...t, timing: t.timing, success: t.success }));
    if (p.organising) c.organising = {
      whoActs: p.organising.whoActs, asks: p.organising.asks,
      roles: (p.organising.roles || []).map(r => [r.role, r.what]),
      ladder: (p.organising.ladder || []).map(l => [l.rung, l.action]),
      oneToOne: p.organising.oneToOne, event: p.organising.event, channels: p.organising.channels,
      followup: p.organising.followup, sustain: p.organising.sustain, metrics: p.organising.metrics,
      coalition: p.organising.coalition, whyParticipate: p.organising.whyParticipate, humanEssential: p.organising.humanEssential
    };
    if (p.risks && p.risks.length) c.risks = p.risks;
    if (p.assumptions && p.assumptions.length) c.assumptions = p.assumptions;
    if (p.metrics) c.metrics = { ...c.metrics, campaign: p.metrics.campaign || c.metrics.campaign, organising: p.metrics.organising || c.metrics.organising };
    c.qualityFlags = p.qualityFlags || [];
  }

  function mergeDrafts(c, d) { c.live = c.live || {}; c.live.drafts = d; if (d.media && d.media.headline) c.media.headline = d.media.headline; if (d.media && d.media.altAngles) c.media.angles = d.media.altAngles; }

  /* ---------- pipeline ---------- */
  /* hooks: onStage(idx), onNote(text), onSources(claims), onFail(stageName, error) -> Promise<"retry"|"skip"> */
  async function run(input, campaign, hooks) {
    const note = (t) => hooks && hooks.onNote && hooks.onNote(t);
    campaign.mode = "live";
    campaign.generatedLive = true;
    campaign.live = campaign.live || {};

    // deterministic geography (keyless)
    const pc = await postcodeLookup(input.location || input.problem);
    if (pc) { note("Geography verified via postcodes.io: " + pc.data.admin_district); }

    // Call A — research
    let research = null;
    await stageLoop("Live research", hooks, async () => {
      research = await researchCall(input, hooks);
    });
    if (research) mergeResearch(campaign, research, pc);
    else { campaign.sources = pc ? [pc] : []; campaign.researchUnavailable = true; note("Research unavailable — continuing with clearly-labelled unverified baseline."); }

    // Call B — plan
    let plan = null;
    await stageLoop("Campaign plan", hooks, async () => {
      plan = await planCall(input, research || { note: "Research unavailable — plan from user input only; mark everything needing verification." });
    });
    if (plan) mergePlan(campaign, plan);

    // Call C — drafts
    let drafts = null;
    await stageLoop("Drafting resources", hooks, async () => {
      drafts = await draftsCall(input, research || {}, plan || {});
    });
    if (drafts) mergeDrafts(campaign, drafts);

    campaign.liveComplete = { research: !!research, plan: !!plan, drafts: !!drafts };
    return campaign;
  }

  async function stageLoop(name, hooks, fn) {
    for (; ;) {
      try { await fn(); return; }
      catch (e) {
        console.error(name, e);
        if (!(hooks && hooks.onFail)) return;
        const decision = await hooks.onFail(name, e);
        if (decision !== "retry") return;
      }
    }
  }

  window.CF_LIVE = { configured, getKey, setKey, run, MODEL };
})();
