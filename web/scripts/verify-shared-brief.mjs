// READ-ONLY regression verification for a shared-link campaign brief.
// Launches a FRESH chromium context (no run token => shared-link viewer),
// navigates to /factory/c/<id>, waits ~12s for hydration, and extracts the
// structural facts the regression check cares about. Prints one JSON blob.
import { chromium } from "playwright";

const id = process.argv[2];
if (!id) {
  console.error("usage: node verify-shared-brief.mjs <campaignId>");
  process.exit(2);
}
const BASE = "https://campaign-factory-campaign-lab.vercel.app";
const url = `${BASE}/factory/c/${id}`;

const consoleErrors = [];
const pageErrors = [];
const badResponses = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext(); // fresh => no localStorage token
const page = await context.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => pageErrors.push(String(err)));
page.on("response", (res) => {
  const s = res.status();
  if (s >= 400) badResponses.push({ status: s, url: res.url() });
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
try {
  await page.waitForLoadState("networkidle", { timeout: 20000 });
} catch {}
await page.waitForTimeout(12000); // hydration + stream fold + compiled fetch

const data = await page.evaluate(() => {
  const txt = (el) => (el ? el.textContent.trim().replace(/\s+/g, " ") : null);
  const heroH1 = txt(document.querySelector("header.jhero h1"));
  const heroCaption = txt(document.querySelector("header.jhero p.obj"));
  const gradeEl = document.querySelector(".fa-grade");
  const grade = gradeEl
    ? { text: txt(gradeEl), tone: gradeEl.getAttribute("data-tone") }
    : null;

  const railAnchors = Array.from(document.querySelectorAll("nav.rail a")).map((a) => ({
    n: txt(a),
    title: a.getAttribute("title"),
    href: a.getAttribute("href"),
  }));

  const stages = Array.from(document.querySelectorAll("[data-stage]")).map((s) => {
    const h2 = s.querySelector("h2");
    const nEl = s.querySelector(".n");
    return {
      stage: s.getAttribute("data-stage"),
      n: nEl ? txt(nEl) : null,
      h2: txt(h2),
    };
  });

  const draftblocks = Array.from(document.querySelectorAll(".draftblock")).map((d) =>
    txt(d.querySelector(".db-head")),
  );
  const readTheRest = document.querySelectorAll("details.fa-material-more summary").length;

  const allDocCards = Array.from(document.querySelectorAll(".doccard"));
  const soonCards = allDocCards.filter((c) => c.classList.contains("fa-doccard--soon"));
  const builtCards = allDocCards.filter((c) => !c.classList.contains("fa-doccard--soon"));
  const builtWithActions = builtCards.map((c) => {
    const btns = Array.from(c.querySelectorAll(".dd-actions .toolbtn")).map((b) => txt(b));
    return { title: txt(c.querySelector(".d-t") || c.querySelector("b")) || null, buttons: btns };
  });
  const copyCount = builtWithActions.filter((b) => b.buttons.some((x) => /Copy/i.test(x))).length;
  const wordCount = builtWithActions.filter((b) => b.buttons.some((x) => /Word/i.test(x))).length;

  return {
    heroH1,
    heroCaption,
    grade,
    railCount: railAnchors.length,
    railNumbers: railAnchors.map((a) => a.n).join(","),
    railTitles: railAnchors.map((a) => a.title),
    stages,
    hasDrafted: stages.some((s) => s.stage === "drafted"),
    draftblockCount: draftblocks.length,
    readTheRestCount: readTheRest,
    docCardsTotal: allDocCards.length,
    docCardsBuilt: builtCards.length,
    docCardsSoon: soonCards.length,
    builtCopyBtns: copyCount,
    builtWordBtns: wordCount,
    title: document.title,
  };
});

console.log(JSON.stringify({
  id, url,
  data,
  consoleErrors,
  pageErrors,
  badResponses,
}, null, 2));

await browser.close();
