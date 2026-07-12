/* Campaign Factory shell: landing → processing → journey (→ per-document editor).
   Live mode (API key set): real research + generation drive the stages, with a
   presenter-visible retry/skip banner on any failure. Simulated mode (no key,
   or key cleared): the timed offline fallback — the emergency backup path.
   URL modes: ?auto (backup example) · ?fast (short sim) · ?auto&skip (straight
   to journey) · press "." during processing to fast-forward the simulation. */

(function () {
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const FAST = new URLSearchParams(location.search).has("fast");

  let campaign = null, docs = [], curDoc = 0;
  const timers = [];
  const edits = {};

  const EXAMPLE_LIME = {
    problem: "I want Lime bikes to be allowed to enter Queen Elizabeth Olympic Park in Stratford. This affects people who use shared bikes to travel to and around the park. Identify who controls the decision, why the current restriction exists, and what campaign could change it.",
    org: "", location: "Stratford, London E20", outcome: "Shared e-bikes permitted to ride and park within the park", dm: "", timeframe: "", affected: "park visitors, commuters crossing the park, shared-bike users", evidence: "", resources: ""
  };
  const EXAMPLE_BACKUP = {
    problem: "The council plans to close the local library in six weeks. Residents want the decision reversed or delayed while alternative funding options are considered.",
    org: "Friends of the Library", location: "Nottingham", outcome: "", dm: "", timeframe: "six weeks", affected: "", evidence: "", resources: ""
  };

  /* ---------- views & nav ---------- */
  function show(view) {
    $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
    $("#nav-new").classList.toggle("cur", view === "landing");
    $("#nav-lib").classList.toggle("cur", view === "library");
    $("#nav-camp").classList.toggle("cur", view === "journey" || view === "doc");
    $("#nav-camp").disabled = !campaign;
    window.scrollTo(0, 0);
  }
  $("#nav-new").addEventListener("click", () => show("landing"));
  $("#nav-lib").addEventListener("click", () => { renderLibrary(); show("library"); });
  $("#nav-camp").addEventListener("click", () => { if (campaign) show("journey"); });

  /* ---------- campaign library (persisted in localStorage, per browser/origin) ---------- */
  const LIB_KEY = "cf_campaigns";
  const LIB_MAX = 20;                                   // ~100KB per campaign vs ~5MB quota
  const esc = (s) => String(s || "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  function libAll() { try { return JSON.parse(localStorage.getItem(LIB_KEY)) || []; } catch (e) { return []; } }
  function libWrite(list) {
    for (;;) {
      try { localStorage.setItem(LIB_KEY, JSON.stringify(list)); return; }
      catch (e) { if (!list.length) return; list.pop(); }   // quota hit: evict oldest and retry
    }
  }
  function libSave() {
    if (!campaign || window.CF_REVIEW_CAMPAIGN) return;
    if (!campaign.libId) campaign.libId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const rec = {
      id: campaign.libId,
      name: campaign.name,
      problem: (campaign.input && campaign.input.problem) || "",
      mode: campaign.mode === "live" ? "live" : "simulated",
      savedAt: new Date().toISOString(),
      campaign, edits: Object.assign({}, edits)
    };
    const list = libAll().filter(r => r.id !== rec.id);
    list.unshift(rec);
    if (list.length > LIB_MAX) list.length = LIB_MAX;
    libWrite(list);
  }
  function libOpen(id) {
    const rec = libAll().find(r => r.id === id);
    if (!rec) return;
    campaign = rec.campaign;
    campaign.libId = rec.id;
    campaign.generatedAt = new Date(campaign.generatedAt);           // revive from JSON
    if (campaign.deadline && campaign.deadline.date) campaign.deadline.date = new Date(campaign.deadline.date);
    Object.keys(edits).forEach(k => delete edits[k]);
    Object.assign(edits, rec.edits || {});
    docs = window.CF_DOCS(campaign);
    renderJourney();
    Object.keys(edits).forEach(k => { const inline = $(`.dd-sheet[data-doc="${k}"]`); if (inline && edits[k]) inline.innerHTML = edits[k]; });
    show("journey");
  }
  function renderLibrary() {
    const list = libAll();
    $("#lib-empty").style.display = list.length ? "none" : "block";
    $("#libgrid").innerHTML = list.map(r => {
      const d = new Date(r.savedAt);
      const when = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      return `<div class="doccard" data-id="${r.id}">
        <span class="d-n">${when} · ${r.mode === "live" ? "Live research" : "Simulated"}</span>
        <h3>${esc(r.name)}</h3>
        <p class="d-prev">${esc((r.problem || "").slice(0, 170))}${(r.problem || "").length > 170 ? "…" : ""}</p>
        <span style="display:flex;justify-content:space-between;align-items:center;gap:.6rem">
          <span class="d-open">Open campaign →</span>
          <button class="toolbtn lib-del" data-id="${r.id}">Delete</button>
        </span>
      </div>`;
    }).join("");
    $$("#libgrid .lib-del").forEach(b => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const rec = libAll().find(r => r.id === b.dataset.id);
      if (!rec || !confirm(`Delete “${rec.name}” from the library?`)) return;
      if (campaign && campaign.libId === b.dataset.id) campaign.libId = null;
      libWrite(libAll().filter(r => r.id !== b.dataset.id));
      renderLibrary();
      toast("Campaign deleted");
    }));
    $$("#libgrid .doccard").forEach(c => c.addEventListener("click", () => libOpen(c.dataset.id)));
  }

  /* ---------- settings / live chip ---------- */
  function refreshChip() {
    const on = window.CF_LIVE.configured();
    const chip = $("#livechip");
    chip.classList.toggle("on", on); chip.classList.toggle("off", !on);
    $("#livechip-t").textContent = on ? "Live mode ready" : "Simulated mode";
  }
  $("#btn-settings").addEventListener("click", (e) => { e.stopPropagation(); $("#in-key").value = window.CF_LIVE.getKey(); $("#settings").classList.toggle("show"); });
  $("#btn-key-save").addEventListener("click", () => { window.CF_LIVE.setKey($("#in-key").value); refreshChip(); $("#settings").classList.remove("show"); toast(window.CF_LIVE.configured() ? "Live mode ready" : "No key — simulated mode"); });
  $("#btn-key-clear").addEventListener("click", () => { window.CF_LIVE.setKey(""); $("#in-key").value = ""; refreshChip(); toast("Key cleared — simulated mode"); });
  document.addEventListener("click", (e) => { if (!$("#settings").contains(e.target) && e.target.id !== "btn-settings") $("#settings").classList.remove("show"); });
  refreshChip();

  /* ---------- intake ---------- */
  function readInput() {
    return {
      problem: $("#in-problem").value.trim(), org: $("#in-org").value.trim(), location: $("#in-location").value.trim(),
      outcome: $("#in-outcome").value.trim(), dm: $("#in-dm").value.trim(), timeframe: $("#in-timeframe").value.trim(),
      affected: $("#in-affected").value.trim(), evidence: $("#in-evidence").value.trim(), resources: $("#in-resources").value.trim()
    };
  }
  function fillInput(x) { $("#in-problem").value = x.problem; $("#in-org").value = x.org || ""; $("#in-location").value = x.location || ""; $("#in-outcome").value = x.outcome || ""; $("#in-dm").value = x.dm || ""; $("#in-timeframe").value = x.timeframe || ""; $("#in-affected").value = x.affected || ""; $("#in-evidence").value = x.evidence || ""; $("#in-resources").value = x.resources || ""; }
  let exampleToggle = false;
  $("#btn-example").addEventListener("click", () => { fillInput(exampleToggle ? EXAMPLE_BACKUP : EXAMPLE_LIME); exampleToggle = !exampleToggle; $("#in-problem").focus(); });
  $("#btn-build").addEventListener("click", () => {
    const input = readInput();
    if (input.problem.length < 20) { toast("Describe the problem in a sentence or two first."); $("#in-problem").focus(); return; }
    build(input);
  });

  /* ---------- processing stages ---------- */
  const STAGES = [
    ["Interpreting the campaign problem", "what's being asked; what's missing; whether it fits UK local scope"],
    ["Researching the location and issue", "live web research against official and authoritative UK sources"],
    ["Verifying institutions and responsibilities", "who is formally responsible; recording sources and verification status"],
    ["Identifying the decision-maker", "formal authority vs practical influence"],
    ["Defining the campaign objective", "decision-maker · specific action · timeframe · minimum viable win"],
    ["Mapping power and stakeholders", "allies, opponents, mobilisers — with evidence status per position"],
    ["Analysing pressure", "what makes the status quo costlier than change, for this target"],
    ["Building the strategy", "narrative, route, coalition, phases, escalation"],
    ["Sequencing tactics", "targets, owners, success signs, human approval points"],
    ["Planning organising", "ladder of engagement, roles, one-to-ones, follow-up"],
    ["Drafting campaign materials", "emails, press release, scripts, action pages — from the shared plan"],
    ["Checking evidence and consistency", "specificity review; unverified items flagged, never invented"]
  ];
  // stage indices per live pipeline step
  const LIVE_MAP = { interpret: 0, research: 1, verify: 2, plan: [3, 4, 5, 6, 7, 8, 9], drafts: 10, check: 11 };

  function paintStages() {
    const box = $("#proc-stages"); box.innerHTML = "";
    STAGES.forEach(([t, n]) => {
      const d = document.createElement("div");
      d.className = "stg";
      d.innerHTML = `<span class="ic"></span><span><span class="t">${t}</span><span class="note">${n}</span></span>`;
      box.appendChild(d);
    });
  }
  function setStage(i, state) {
    const els = $$("#proc-stages .stg");
    els.forEach((el, j) => {
      if (j < i) { el.classList.add("done"); el.classList.remove("run"); }
      else if (j === i) { el.classList.toggle("run", state !== "done"); el.classList.toggle("done", state === "done"); }
    });
    $("#pbar-fill").style.width = Math.round(((i + (state === "done" ? 1 : 0.5)) / STAGES.length) * 100) + "%";
  }
  function stageNote(i, text) { const el = $$("#proc-stages .stg")[i]; if (el) el.querySelector(".note").textContent = text; }

  /* ---------- build ---------- */
  async function build(input) {
    campaign = window.CF_ENGINE.build(input);   // simulated baseline = shared state skeleton
    Object.keys(edits).forEach(k => delete edits[k]);   // edits belong to the previous campaign
    show("processing");
    paintStages();
    $("#procfail").classList.remove("show");
    $("#proc-title").textContent = campaign.name;
    $("#proc-mode").textContent = window.CF_LIVE.configured() ? "Building your campaign · live research" : "Building your campaign · simulated mode (no live research)";

    if (window.CF_LIVE.configured()) await buildLive(input);
    else await buildSimulated();

    docs = window.CF_DOCS(campaign);
    renderJourney();
    show("journey");
    libSave();                                   // every generated campaign lands in the library
  }

  async function buildLive(input) {
    setStage(0, "run"); await pause(FAST ? 200 : 1600); setStage(0, "done");
    let stageIdx = LIVE_MAP.research;
    setStage(stageIdx, "run");
    let planTicker = null;
    try {
      await window.CF_LIVE.run(input, campaign, {
        onNote: (t) => stageNote(stageIdx, t),
        onSources: (claims) => {
          setStage(LIVE_MAP.research, "done");
          stageNote(LIVE_MAP.verify, `${claims.length} claims recorded with sources and verification status`);
          setStage(LIVE_MAP.verify, "done");
          stageIdx = 3; setStage(3, "run");
          // walk the plan-related stages while call B runs
          let k = 0;
          planTicker = setInterval(() => {
            if (k < LIVE_MAP.plan.length - 1) { setStage(LIVE_MAP.plan[k], "done"); k++; stageIdx = LIVE_MAP.plan[k]; setStage(stageIdx, "run"); }
          }, FAST ? 300 : 4500);
        },
        onFail: (name, err) => new Promise((resolve) => {
          if (planTicker) { clearInterval(planTicker); planTicker = null; }
          $("#procfail-title").textContent = name + " failed";
          $("#procfail-msg").textContent = String(err && err.message || err) + " — you can retry, or continue: completed stages are preserved and the missing stage falls back to labelled simulated output.";
          $("#procfail").classList.add("show");
          $("#procfail-retry").onclick = () => { $("#procfail").classList.remove("show"); resolve("retry"); };
          $("#procfail-skip").onclick = () => { $("#procfail").classList.remove("show"); resolve("skip"); };
        })
      });
    } finally { if (planTicker) clearInterval(planTicker); }
    // close out plan stages, drafts, check
    LIVE_MAP.plan.forEach(i => setStage(i, "done"));
    setStage(LIVE_MAP.drafts, "run"); await pause(400); setStage(LIVE_MAP.drafts, "done");
    setStage(LIVE_MAP.check, "run");
    stageNote(LIVE_MAP.check, (campaign.qualityFlags && campaign.qualityFlags.length) ? `${campaign.qualityFlags.length} items flagged for human review` : "consistency check complete");
    await pause(FAST ? 200 : 1500);
    setStage(LIVE_MAP.check, "done");
  }

  function buildSimulated() {
    campaign.mode = "simulated";
    return new Promise((resolve) => {
      const per = FAST ? 400 : 6300;   // 12 stages ≈ 75s
      STAGES.forEach((_, i) => {
        timers.push(setTimeout(() => {
          if (i === 1) stageNote(1, "simulated mode — no live research ran; outputs are labelled accordingly");
          setStage(i, "run");
          if (i > 0) setStage(i - 1 < 0 ? 0 : i, "run");
        }, i * per));
      });
      timers.push(setTimeout(() => { STAGES.forEach((_, i) => setStage(i, "done")); resolve(); }, STAGES.length * per));
      document.addEventListener("keydown", function ff(e) {
        if (e.key === "." && $("#view-processing").classList.contains("active")) {
          timers.forEach(clearTimeout); timers.length = 0;
          STAGES.forEach((_, i) => setStage(i, "done"));
          document.removeEventListener("keydown", ff);
          resolve();
        }
      });
    });
  }
  const pause = (ms) => new Promise(r => setTimeout(r, ms));

  /* ---------- journey ---------- */
  function renderJourney() {
    $("#journey").innerHTML = window.CF_JOURNEY.render(campaign, docs);
    // subnav highlight
    const links = $$(".subnav a");
    const stages = $$(".jstage");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id.replace("j-", "");
          links.forEach(a => a.classList.toggle("cur", a.dataset.nav === id));
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    stages.forEach(s => io.observe(s));
    // power map
    $$(".pm-node").forEach(n => n.addEventListener("click", () => {
      const s = campaign.stakeholders[+n.dataset.stake];
      $("#stakepanel-body").innerHTML = window.CF_JOURNEY.stakePanelHTML(s);
      $("#stakepanel").classList.add("show");
    }));
    const sp = $(".sp-close"); if (sp) sp.addEventListener("click", () => $("#stakepanel").classList.remove("show"));
    // doc dropdown actions
    $$(".dd-copy").forEach(b => b.addEventListener("click", async (e) => { e.preventDefault(); e.stopPropagation(); await window.CF_EXPORT.copy(sheetFor(b.dataset.doc)); toast("Copied as Markdown"); }));
    $$(".dd-dl").forEach(b => b.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); const d = docs.find(x => x.id === b.dataset.doc); window.CF_EXPORT.markdown(sheetFor(b.dataset.doc), d.title, campaign.name); toast("Markdown downloaded"); }));
    $$(".dd-open").forEach(b => b.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openDoc(docs.findIndex(x => x.id === b.dataset.doc), b.dataset.edit === "1"); }));
    // draft block copy
    $$(".db-copy").forEach(b => b.addEventListener("click", async () => { const body = b.closest(".draftblock").querySelector(".db-body"); await window.CF_EXPORT.copy(body); toast("Copied"); }));
    // source filters
    $$(".srcfilters .toolbtn").forEach(b => b.addEventListener("click", () => {
      $$(".srcfilters .toolbtn").forEach(x => x.classList.remove("on")); b.classList.add("on");
      const f = b.dataset.filter;
      $$(".srccard").forEach(c => c.style.display = (f === "all" || c.dataset.status === f) ? "" : "none");
    }));
  }
  function sheetFor(id) {
    // prefer an edited full-page version, else the inline dropdown sheet, else a detached render
    const inline = $(`.dd-sheet[data-doc="${id}"]`);
    if (edits[id]) { const d = document.createElement("div"); d.innerHTML = edits[id]; return d; }
    if (inline) return inline;
    const d = document.createElement("div"); d.innerHTML = docs.find(x => x.id === id).html; return d;
  }

  /* ---------- document editor (from library) ---------- */
  function openDoc(i, edit) {
    if (i < 0) return;
    curDoc = i;
    const d = docs[i];
    $("#doc-pos").textContent = `Document ${d.n} of 9 · ${d.title}`;
    const sheet = $("#docsheet");
    sheet.innerHTML = edits[d.id] || d.html;
    sheet.setAttribute("contenteditable", edit ? "true" : "false");
    $("#btn-edit").classList.toggle("on", !!edit);
    $("#btn-edit").textContent = edit ? "✓ Editing — click to finish" : "✎ Edit";
    show("doc");
  }
  function saveEdits() { const d = docs[curDoc]; edits[d.id] = $("#docsheet").innerHTML; const inline = $(`.dd-sheet[data-doc="${d.id}"]`); if (inline) inline.innerHTML = edits[d.id]; if (campaign && campaign.libId) libSave(); }
  $("#btn-back").addEventListener("click", () => { saveEdits(); show("journey"); });
  $("#btn-prev").addEventListener("click", () => { saveEdits(); openDoc((curDoc + docs.length - 1) % docs.length); });
  $("#btn-next").addEventListener("click", () => { saveEdits(); openDoc((curDoc + 1) % docs.length); });
  $("#btn-edit").addEventListener("click", () => {
    const sheet = $("#docsheet");
    const on = sheet.getAttribute("contenteditable") === "true";
    sheet.setAttribute("contenteditable", on ? "false" : "true");
    $("#btn-edit").classList.toggle("on", !on);
    $("#btn-edit").textContent = on ? "✎ Edit" : "✓ Editing — click to finish";
    if (on) saveEdits(); else sheet.focus();
  });
  $("#btn-copy").addEventListener("click", async () => { await window.CF_EXPORT.copy($("#docsheet")); toast("Copied as Markdown"); });
  $("#btn-export").addEventListener("click", (e) => { e.stopPropagation(); $("#export-menu").classList.toggle("show"); });
  document.addEventListener("click", () => $("#export-menu").classList.remove("show"));
  $("#exp-md").addEventListener("click", () => { window.CF_EXPORT.markdown($("#docsheet"), docs[curDoc].title, campaign.name); toast("Markdown downloaded"); });
  $("#exp-txt").addEventListener("click", () => { window.CF_EXPORT.text($("#docsheet"), docs[curDoc].title, campaign.name); toast("Plain text downloaded"); });
  $("#exp-pdf").addEventListener("click", () => window.CF_EXPORT.print());

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200); }

  /* ---------- review mode: render a captured campaign object (smoke.html) ---------- */
  const P = new URLSearchParams(location.search);
  if (window.CF_REVIEW_CAMPAIGN) {
    campaign = window.CF_REVIEW_CAMPAIGN;
    campaign.generatedAt = new Date(campaign.generatedAt);           // revive from JSON
    if (campaign.deadline && campaign.deadline.date) campaign.deadline.date = new Date(campaign.deadline.date);
    docs = window.CF_DOCS(campaign);
    renderJourney();
    show("journey");
    $("#nav-camp").disabled = false;
  } else if (P.has("auto")) {
    fillInput(P.has("lime") ? EXAMPLE_LIME : EXAMPLE_BACKUP);
    if (P.has("skip")) {
      campaign = window.CF_ENGINE.build(readInput());
      campaign.mode = "simulated";
      docs = window.CF_DOCS(campaign);
      renderJourney();
      show("journey");
      const dn = parseInt(P.get("doc"), 10);
      if (dn >= 1 && dn <= 9) openDoc(dn - 1);
    } else {
      build(readInput());
    }
  } else if (P.has("lib")) {
    renderLibrary();
    show("library");
  } else {
    show("landing");
  }
})();
