/* Campaign Factory prototype runtime.
   States (S0..S7) -> internal reveal steps -> next state.
   Keyboard: arrows/space advance, 1-8 jump, [ ] switch prototype, i about, s notes, Esc close. */

(function () {
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  const states = $$(".state");
  const stepper = $(".stepper");
  const gatebar = $(".gatebar");
  const drawer = $(".drawer");
  const notes = $(".notes");
  const pop = $(".pop");
  const ALL = new URLSearchParams(location.search).has("all");

  let cur = 0;
  let approved = false;
  const timers = [];

  /* ---------- stepper ---------- */
  states.forEach((st, i) => {
    const b = document.createElement("button");
    b.dataset.label = st.dataset.label || "S" + i;
    b.addEventListener("click", () => go(i));
    stepper.appendChild(b);
  });

  function clearTimers() { timers.forEach(clearTimeout); timers.length = 0; }
  function later(fn, ms) { if (ALL) { fn(); } else { timers.push(setTimeout(fn, ms)); } }

  /* ---------- state router ---------- */
  function go(i, fromHash) {
    if (i < 0 || i >= states.length) return;
    clearTimers();
    closeOverlays();
    cur = i;
    states.forEach((st, j) => st.classList.toggle("active", j === i));
    $$(".stepper button").forEach((b, j) => b.classList.toggle("cur", j === i));
    if (!fromHash) history.replaceState(null, "", "#s" + i);

    const st = states[i];
    // reset steps
    $$("[data-step]", st).forEach((el) => el.classList.remove("on"));
    if (ALL) { $$("[data-step]", st).forEach((el) => { el.classList.add("on"); activate(el); }); }
    else { advanceStep(); } // reveal step 1 automatically
    updateGate(st);
    updateNotes(st);
  }

  function stepsOf(st) {
    return $$("[data-step]", st).sort((a, b) => (+a.dataset.step) - (+b.dataset.step));
  }

  function advanceStep() {
    const st = states[cur];
    const next = stepsOf(st).find((el) => !el.classList.contains("on"));
    if (!next) return false;
    // reveal every element sharing that step number together
    const n = next.dataset.step;
    stepsOf(st).filter((el) => el.dataset.step === n).forEach((el) => {
      el.classList.add("on");
      activate(el);
    });
    return true;
  }

  function backStep() {
    const st = states[cur];
    const on = stepsOf(st).filter((el) => el.classList.contains("on"));
    if (on.length <= 1) return false; // keep step 1
    const n = on[on.length - 1].dataset.step;
    on.filter((el) => el.dataset.step === n).forEach((el) => el.classList.remove("on"));
    return true;
  }

  function next() { if (!advanceStep()) go(Math.min(cur + 1, states.length - 1)); }
  function back() { if (!backStep()) go(Math.max(cur - 1, 0)); }

  /* ---------- step behaviours ---------- */
  function activate(root) {
    const els = [root].concat($$("[data-tasks],[data-type],[data-wall],[data-count]", root));
    els.forEach((el) => {
      // skip content inside closed tab panels; the tab handler plays it on open
      const panel = el.closest(".tabpanel");
      if (panel && !panel.hasAttribute("data-open")) return;
      if (el.dataset.tasks !== undefined) runTasks(el);
      if (el.dataset.type !== undefined) { typewrite(el); if (panel) panel.dataset.played = "1"; }
      if (el.dataset.wall !== undefined) buildWall(el);
      if (el.dataset.count !== undefined) countUp(el);
    });
  }

  /* task checklist: children .task run serially */
  function runTasks(box) {
    const tasks = $$(".task", box);
    tasks.forEach((t) => { t.classList.remove("run", "done", "fail"); t.classList.add("queued"); });
    let i = 0;
    function step() {
      if (i >= tasks.length) return;
      const t = tasks[i];
      t.classList.remove("queued"); t.classList.add("run");
      const dur = ALL ? 0 : +(t.dataset.dur || 900);
      later(() => {
        t.classList.remove("run");
        t.classList.add(t.dataset.fail !== undefined ? "fail" : "done");
        i++; step();
      }, dur);
    }
    step();
  }

  /* typewriter: types textContent, then restores rich HTML (flags, cites) */
  function typewrite(el) {
    const full = el.dataset.html || el.innerHTML;
    el.dataset.html = full;
    if (ALL) { el.innerHTML = full; return; }
    const txt = el.textContent.trim();
    el.textContent = "";
    el.classList.add("caret");
    let i = 0;
    const chunk = Math.max(2, Math.round(txt.length / 90));
    (function tick() {
      i += chunk;
      el.textContent = txt.slice(0, i);
      if (i < txt.length) timers.push(setTimeout(tick, 22));
      else { el.classList.remove("caret"); el.innerHTML = full; }
    })();
  }

  /* count-up for hero numbers */
  function countUp(el) {
    const target = +el.dataset.count;
    if (ALL) { el.textContent = target.toLocaleString(); return; }
    const t0 = performance.now(), dur = 1400;
    (function tick(t) {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (p * (2 - p))).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* factory wall: fills grid with real place names; animates a capped wave */
  function buildWall(el) {
    const cfg = window.WALL || {};
    const names = cfg.names || [];
    const total = cfg.total || names.length;
    const cap = Math.min(cfg.animate || 18, names.length);
    el.innerHTML = "";
    const cells = [];
    // repeat names to fill ~total cells but cap DOM at 420
    const domCount = Math.min(total, 420);
    for (let i = 0; i < domCount; i++) {
      const c = document.createElement("div");
      c.className = "wcell";
      c.innerHTML = "<b>" + names[i % names.length] + "</b><i>queued</i>";
      el.appendChild(c); cells.push(c);
    }
    let k = 0;
    (function wave() {
      if (k >= cap) return;
      const c = cells[k];
      c.classList.add("run"); c.lastChild.textContent = cfg.runLabel || "running";
      later(() => { c.classList.remove("run"); c.classList.add("done"); c.lastChild.textContent = cfg.doneLabel || "done"; }, 700);
      k++;
      later(wave, 260);
    })();
  }

  /* ---------- gate bar ---------- */
  function updateGate(st) {
    const g = st.dataset.gate;
    if (!g || g === "none") { gatebar.classList.remove("show"); return; }
    gatebar.classList.add("show");
    renderGate();
  }
  function renderGate() {
    const blocked = $(".g-blocked", gatebar), ok = $(".g-approved", gatebar);
    if (blocked) blocked.style.display = approved ? "none" : "flex";
    if (ok) ok.style.display = approved ? "flex" : "none";
  }

  /* ---------- approval dialog ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (t.matches("[data-open-dialog]")) { $(t.dataset.openDialog).classList.add("show"); }
    if (t.matches("[data-close-dialog]")) { t.closest(".scrim").classList.remove("show"); }
    if (t.matches("[data-approve]")) {
      approved = true;
      t.closest(".scrim").classList.remove("show");
      renderGate();
      $$("[data-needs-approval]").forEach((b) => { b.disabled = false; b.classList.remove("locked"); b.classList.add("approve"); });
    }
    if (t.matches("[data-fix]")) {
      // "Request changes": swap flagged text for fixed text
      t.closest(".scrim").classList.remove("show");
      $$(".swap-flag").forEach((el) => (el.style.display = "none"));
      $$(".swap-fix").forEach((el) => (el.style.display = "inline"));
      $$(".swap-fixnote").forEach((el) => (el.style.display = "block"));
    }
    if (t.matches("[data-noop-export]")) { showPop(t, { src: "Prototype", meta: "", quote: "Export is intentionally disabled in this prototype. In production this downloads the approved pack." }); }
    if (t.matches(".cite") && t.dataset.pop) {
      const c = (window.CITES || {})[t.dataset.pop];
      if (c) showPop(t, c);
      e.stopPropagation();
      return;
    }
    if (!pop.contains(t)) pop.classList.remove("show");
  });

  function showPop(anchor, c) {
    $(".p-src", pop).textContent = c.src || "";
    $(".p-meta", pop).textContent = c.meta || "";
    $("blockquote", pop).textContent = c.quote || "";
    pop.classList.add("show");
    const r = anchor.getBoundingClientRect();
    pop.style.left = Math.min(r.left, innerWidth - 680) + "px";
    pop.style.top = Math.min(r.bottom + 12, innerHeight - 260) + "px";
  }

  /* ---------- tabs ---------- */
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const group = tab.closest("[data-tabs]");
      $$(".tab", group).forEach((t) => t.removeAttribute("data-selected"));
      tab.setAttribute("data-selected", "");
      $$(".tabpanel", group).forEach((p) => p.removeAttribute("data-open"));
      const panel = $('.tabpanel[data-panel="' + tab.dataset.tab + '"]', group);
      panel.setAttribute("data-open", "");
      const tw = $("[data-type]", panel);
      if (tw && !panel.dataset.played) { panel.dataset.played = "1"; typewrite(tw); }
    });
  });

  /* ---------- overlays ---------- */
  function closeOverlays() {
    pop.classList.remove("show");
    $$(".scrim").forEach((s) => s.classList.remove("show"));
  }
  $("[data-drawer-toggle]") && $("[data-drawer-toggle]").addEventListener("click", () => drawer.classList.toggle("show"));
  $("[data-drawer-close]") && $("[data-drawer-close]").addEventListener("click", () => drawer.classList.remove("show"));

  function updateNotes(st) {
    if (!notes) return;
    const n = st.dataset.notes;
    $(".n-body", notes).textContent = n || "";
    if (!n) notes.classList.remove("show");
  }

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { drawer.classList.remove("show"); notes.classList.remove("show"); closeOverlays(); return; }
    if (e.target.matches("input, textarea")) return;
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); back(); }
    else if (/^[1-8]$/.test(e.key)) go(+e.key - 1);
    else if (e.key === "i") drawer.classList.toggle("show");
    else if (e.key === "s") notes.classList.toggle("show");
    else if (e.key === "[" && window.PROTO && window.PROTO.prev) location.href = window.PROTO.prev + "#s" + cur;
    else if (e.key === "]" && window.PROTO && window.PROTO.next) location.href = window.PROTO.next + "#s" + cur;
  });

  /* clicking anywhere advances only via explicit next buttons */
  $$("[data-next]").forEach((b) => b.addEventListener("click", next));

  window.addEventListener("hashchange", () => {
    const m = location.hash.match(/^#s(\d+)$/);
    if (m) go(+m[1], true);
  });

  const m = location.hash.match(/^#s(\d+)$/);
  go(m ? +m[1] : 0, true);
})();
