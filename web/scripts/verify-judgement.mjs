#!/usr/bin/env node
// verify-judgement.mjs — END-TO-END PROD verification of the human-judgement
// interaction (W4). Confirms the fix in useFactoryRun.answerJudgement (now
// attaches x-factory-stream-token) + YourJudgementCard: the person who STARTED
// the run (their stream token lives in localStorage of the creating browser)
// can DECIDE a judgement without hitting a 401 or the "couldn't send that"
// failure copy.
//
// Flow:
//   1. Pre-flight the worker /health until stable (status "ok", uptimeSec >= 30).
//      Poll every 10s up to 5 min (worker redeploys around 08:30).
//   2. Open PROD /factory in ONE chromium context, fill + submit the intake,
//      follow the client redirect to /factory/c/<id>. The stream token is now in
//      localStorage of THIS context — we NEVER open a second context (rule 6).
//   3. Poll the DOM for a "Needs your decision" card; click its FIRST option.
//   4. PASS within 20s of the click: the failure copy does NOT appear AND the
//      card transitions to its decided state ("Your decision recorded").
//      Strongest signal: the POST to /judgements/ returns 2xx (401 => FAIL).
//   5. If the run finishes with NO judgement card ever => INCONCLUSIVE.
//
// Usage:  cd web && node scripts/verify-judgement.mjs
// Read-only against prod EXCEPT for starting ONE real run (~$1.40, authorised).

import { chromium } from "playwright";

const PROD = "https://campaign-factory-campaign-lab.vercel.app";
const WORKER_HEALTH = "https://worker-production-cae4.up.railway.app/health";

const PROBLEM = "Reopen the Beaumont Way pelican crossing near the primary school";
const PLACE = "Leicester";

// Exact UI copy read from YourJudgementCard.tsx (16 Jul 2026).
const FAILURE_COPY = "Couldn't send that just now"; // .yj-error — generic send failure => FAIL
const NO_TOKEN_COPY = "Only the person who started this run can decide"; // .yj-error — shared-link (canDecide=false) => FAIL here

const HEALTH_POLL_MS = 10_000;
const HEALTH_MAX_MS = 5 * 60_000;
const CARD_WAIT_MS = 15 * 60_000; // wait up to 15 min for a decision point
const CARD_POLL_MS = 2_000;
const OBSERVE_MS = 20_000; // PASS window after the click
const OBSERVE_EXTRA_MS = 100_000; // keep watching (logging only) for a late flip
const TERMINAL = new Set(["completed", "partial", "failed", "cancelled"]);

const now = () => new Date().toISOString().slice(11, 19);
const log = (...a) => console.log(`[${now()}]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- worker gate
async function waitForWorker() {
  log(`pre-flight: polling ${WORKER_HEALTH} (need status=ok, uptimeSec>=30)`);
  const deadline = Date.now() + HEALTH_MAX_MS;
  let last = null;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(WORKER_HEALTH, { cache: "no-store" });
      last = await r.json();
      if (last && last.status === "ok" && Number(last.uptimeSec) >= 30) {
        log(`worker STABLE: status=${last.status} uptimeSec=${last.uptimeSec} modelMode=${last.modelMode} env=${last.environmentId}`);
        return last;
      }
      log(`worker not ready: status=${last?.status} uptimeSec=${last?.uptimeSec} — retry in ${HEALTH_POLL_MS / 1000}s`);
    } catch (e) {
      log(`worker /health error: ${e.message} — retry in ${HEALTH_POLL_MS / 1000}s`);
    }
    await sleep(HEALTH_POLL_MS);
  }
  throw new Error(`worker never stabilised within ${HEALTH_MAX_MS / 1000}s (last=${JSON.stringify(last)})`);
}

// Public read model (same endpoint useFactoryRun polls) — used only to know when
// the run is terminal so we can call INCONCLUSIVE if no card ever appears.
async function fetchRunStatus(id) {
  try {
    const r = await fetch(`${PROD}/api/factory/runs/${encodeURIComponent(id)}?after=0`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.status ?? null;
  } catch {
    return null;
  }
}

// Snapshot the judgement cards currently in the DOM.
async function snapshotCards(page) {
  return page.evaluate(() => {
    const all = (sel) => Array.from(document.querySelectorAll(sel));
    const txt = (el) => (el && el.textContent ? el.textContent.trim() : "");
    const firstOpen = document.querySelector(".yj-card--open");
    return {
      open: all(".yj-card--open").length,
      resolved: all(".yj-card--resolved").length,
      defaulted: all(".yj-card--defaulted").length,
      any: all(".yj-card").length,
      errors: all(".yj-error").map(txt).filter(Boolean),
      firstOpenQuestion: txt(firstOpen && firstOpen.querySelector(".yj-q")),
      firstOpenOption: txt(firstOpen && firstOpen.querySelector("button.yj-opt .yj-opt__text")),
      resolvedAnswers: all(".yj-card--resolved .yj-answer").map(txt),
    };
  });
}

async function main() {
  await waitForWorker();

  const browser = await chromium.launch({ headless: true });
  // ONE context, ONE page — kept alive for the whole test (the stream token
  // lives in this context's localStorage; a new context would have no token).
  const context = await browser.newContext();
  const page = await context.newPage();

  const judgementPosts = []; // { status, hasToken, at }
  const startPosts = [];
  const consoleIssues = [];

  page.on("response", (resp) => {
    try {
      const req = resp.request();
      if (req.method() !== "POST") return;
      const url = resp.url();
      if (/\/judgements\//.test(url)) {
        const h = req.headers();
        const rec = { url, status: resp.status(), hasToken: Boolean(h["x-factory-stream-token"]), at: Date.now() };
        judgementPosts.push(rec);
        log(`>> POST /judgements/ -> ${rec.status}  (x-factory-stream-token ${rec.hasToken ? "PRESENT" : "MISSING"})`);
      } else if (/\/api\/factory\/runs(\?|$)/.test(url)) {
        startPosts.push({ status: resp.status(), at: Date.now() });
        log(`>> POST /api/factory/runs -> ${resp.status()}`);
      }
    } catch {
      /* ignore */
    }
  });
  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error" || t === "warning") consoleIssues.push(`${t}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleIssues.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => {
    if (/\/judgements\//.test(req.url())) {
      consoleIssues.push(`requestfailed(judgements): ${req.failure()?.errorText || "?"}`);
    }
  });

  const result = { verdict: "INCONCLUSIVE", reasons: [], runUrl: null, postStatus: null, path: null };

  try {
    // ---- 2. intake ----
    log(`opening ${PROD}/factory`);
    await page.goto(`${PROD}/factory`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.locator("#problem").fill(PROBLEM);
    await page.locator("#place").fill(PLACE);
    await page.waitForFunction(
      () => {
        const b = document.querySelector('button[type="submit"]');
        return !!b && !b.disabled;
      },
      { timeout: 15_000 },
    );
    log(`submitting intake: problem="${PROBLEM}" place="${PLACE}"`);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/factory\/c\/[0-9a-f-]{36}/i, { timeout: 90_000 });
    const runUrl = page.url();
    result.runUrl = runUrl;
    const campaignId = runUrl.split("/factory/c/")[1].split(/[/?#]/)[0];
    log(`RUN URL: ${runUrl}`);

    const stored = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem("cf_factory_run") || "null");
      } catch {
        return null;
      }
    });
    log(`localStorage cf_factory_run: campaignId=${stored?.campaignId} streamToken=${stored?.streamToken ? "PRESENT (canDecide=true)" : "MISSING (canDecide=false)"}`);
    if (!stored?.streamToken) {
      result.reasons.push("WARNING: no stream token stored — this context cannot decide (would surface the no-token copy).");
    }

    // ---- 3. wait for a decision point ----
    log(`waiting up to ${CARD_WAIT_MS / 60000} min for a "Needs your decision" card...`);
    const cardDeadline = Date.now() + CARD_WAIT_MS;
    let sawOpen = false;
    let sawAnyCard = false;
    let lastLog = 0;
    let terminalStatus = null;

    while (Date.now() < cardDeadline) {
      const snap = await snapshotCards(page);
      if (snap.any > 0) sawAnyCard = true;
      if (snap.open > 0) {
        sawOpen = true;
        log(`OPEN card detected. question="${snap.firstOpenQuestion}" firstOption="${snap.firstOpenOption}"`);
        break;
      }
      const status = await fetchRunStatus(campaignId);
      if (Date.now() - lastLog > 30_000) {
        lastLog = Date.now();
        log(`...still waiting. run status=${status} cards(open/def/res/any)=${snap.open}/${snap.defaulted}/${snap.resolved}/${snap.any}`);
      }
      if (status && TERMINAL.has(status)) {
        terminalStatus = status;
        log(`run reached terminal status=${status} before an OPEN card was caught (anyCard=${snap.any}, defaulted=${snap.defaulted}).`);
        break;
      }
      await sleep(CARD_POLL_MS);
    }

    // ---- pick the interaction path ----
    let clickScope = null; // selector whose first button.yj-opt we click
    let reDecide = false;
    if (sawOpen) {
      clickScope = ".yj-card--open";
      result.path = "open card -> first option";
    } else {
      // fallback: a card exists but only in the defaulted state (we missed the
      // open window). Re-decide exercises the SAME token-authorised POST.
      const snap = await snapshotCards(page);
      if (snap.defaulted > 0) {
        reDecide = true;
        clickScope = ".yj-card--defaulted";
        result.path = "defaulted card -> Re-decide -> first option";
        log(`no OPEN card caught; falling back to Re-decide on a defaulted card (same token POST).`);
      }
    }

    if (!clickScope) {
      result.verdict = "INCONCLUSIVE";
      result.reasons.push(
        terminalStatus
          ? `run finished (status=${terminalStatus}) with no judgement card ever appearing`
          : "no judgement card appeared within the 15-min wait",
      );
      await finish(page, campaignId, result);
      await browser.close();
      return;
    }

    // ---- 4. click + observe ----
    if (reDecide) {
      await page.getByRole("button", { name: "Re-decide" }).first().click({ timeout: 10_000 });
      await page.locator(`${clickScope} button.yj-opt`).first().waitFor({ state: "visible", timeout: 10_000 });
    }

    let clickedOption = null;
    try {
      const btn = page.locator(`${clickScope} button.yj-opt`).first();
      clickedOption = (await btn.locator(".yj-opt__text").textContent().catch(() => null))?.trim() || null;
      log(`clicking FIRST option: "${clickedOption}"`);
      await btn.click({ timeout: 10_000 });
    } catch (e) {
      // The card may have flipped between detection and click. Try defaulted Re-decide once.
      log(`first-option click failed (${e.message}); attempting defaulted Re-decide fallback`);
      const snap = await snapshotCards(page);
      if (snap.defaulted > 0) {
        await page.getByRole("button", { name: "Re-decide" }).first().click({ timeout: 10_000 });
        const btn = page.locator(`.yj-card--defaulted button.yj-opt`).first();
        clickedOption = (await btn.locator(".yj-opt__text").textContent().catch(() => null))?.trim() || null;
        await btn.click({ timeout: 10_000 });
        result.path = "defaulted card -> Re-decide -> first option (race fallback)";
      } else {
        throw e;
      }
    }

    const clickAt = Date.now();
    log(`clicked at t0; observing for ${OBSERVE_MS / 1000}s (failure copy must NOT appear; card should flip to "Your decision recorded")`);

    let failureCopySeen = false;
    let noTokenCopySeen = false;
    let resolvedWithin20s = false;
    while (Date.now() - clickAt < OBSERVE_MS) {
      const snap = await snapshotCards(page);
      if (snap.errors.some((t) => t.includes(FAILURE_COPY))) failureCopySeen = true;
      if (snap.errors.some((t) => t.includes(NO_TOKEN_COPY))) noTokenCopySeen = true;
      if (snap.resolved > 0) resolvedWithin20s = true;
      if (failureCopySeen || noTokenCopySeen || resolvedWithin20s) break;
      await sleep(500);
    }

    // Keep watching a while longer purely for the report (does not change verdict).
    let resolvedEventually = resolvedWithin20s;
    let finalCardState = null;
    if (!resolvedWithin20s && !failureCopySeen && !noTokenCopySeen) {
      const extraDeadline = Date.now() + OBSERVE_EXTRA_MS;
      while (Date.now() < extraDeadline) {
        const snap = await snapshotCards(page);
        if (snap.errors.some((t) => t.includes(FAILURE_COPY))) failureCopySeen = true;
        if (snap.resolved > 0) {
          resolvedEventually = true;
          break;
        }
        await sleep(1500);
      }
    }

    const finalSnap = await snapshotCards(page);
    finalCardState = finalSnap.resolved > 0 ? "resolved" : finalSnap.defaulted > 0 ? "defaulted" : finalSnap.open > 0 ? "open" : "none";
    const post = judgementPosts.find((p) => p.at >= clickAt - 3000) || judgementPosts[judgementPosts.length - 1] || null;
    result.postStatus = post ? post.status : null;

    // ---- verdict ----
    if (noTokenCopySeen) {
      result.verdict = "FAIL";
      result.reasons.push('shared-link "no token" copy appeared — this context had no stream token (canDecide=false)');
    } else if (failureCopySeen) {
      result.verdict = "FAIL";
      result.reasons.push(`failure copy appeared: "${FAILURE_COPY}..."`);
    } else if (post && (post.status === 401 || post.status === 403)) {
      result.verdict = "FAIL";
      result.reasons.push(`POST /judgements/ returned ${post.status}`);
    } else if (post && post.status >= 200 && post.status < 300) {
      result.verdict = "PASS";
      result.reasons.push(`POST /judgements/ returned ${post.status} (x-factory-stream-token ${post.hasToken ? "present" : "MISSING"})`);
      result.reasons.push(
        resolvedWithin20s
          ? 'card flipped to "Your decision recorded" within 20s'
          : resolvedEventually
            ? `card flipped to "Your decision recorded" AFTER 20s (POST already authorised; final card state=${finalCardState})`
            : `no failure copy; card had not visibly flipped within observation window (final card state=${finalCardState})`,
      );
    } else if (resolvedWithin20s && !failureCopySeen) {
      result.verdict = "PASS";
      result.reasons.push('card flipped to "Your decision recorded" (POST status not captured by listener)');
    } else {
      result.verdict = "INCONCLUSIVE";
      result.reasons.push(`no POST captured, no failure copy, no resolution observed (final card state=${finalCardState})`);
    }

    if (clickedOption) result.reasons.push(`chose option: "${clickedOption}"`);
    if (finalSnap.resolvedAnswers.length) result.reasons.push(`resolved card text: ${JSON.stringify(finalSnap.resolvedAnswers)}`);

    await finish(page, campaignId, result);
  } catch (e) {
    result.verdict = "ERROR";
    result.reasons.push(`exception: ${e.message}`);
    log(`ERROR: ${e.stack || e.message}`);
  } finally {
    // Report
    console.log("\n============================================================");
    console.log(`VERDICT: ${result.verdict}`);
    console.log(`RUN URL: ${result.runUrl || "(never created)"}`);
    console.log(`POST /judgements/ status: ${result.postStatus ?? "(not captured)"}`);
    console.log(`interaction path: ${result.path || "(none)"}`);
    console.log("reasons:");
    for (const r of result.reasons) console.log(`  - ${r}`);
    console.log(`all /judgements/ POSTs: ${JSON.stringify(judgementPosts)}`);
    console.log(`start POSTs: ${JSON.stringify(startPosts)}`);
    if (consoleIssues.length) {
      console.log(`console/page issues (${consoleIssues.length}):`);
      for (const c of consoleIssues.slice(0, 20)) console.log(`  ! ${c}`);
    } else {
      console.log("console/page issues: none");
    }
    console.log("============================================================");
    await browser.close().catch(() => {});
  }
}

async function finish(page, campaignId, result) {
  const status = await fetchRunStatus(campaignId).catch(() => null);
  result.reasons.push(`final run status (read API): ${status}`);
}

main().catch((e) => {
  console.error("FATAL:", e.stack || e.message);
  process.exitCode = 1;
});
