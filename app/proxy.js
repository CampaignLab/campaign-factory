/* Campaign Factory local proxy — for organisations whose Console settings block
   browser (CORS) API requests, and as the recommended demo-day setup: the API key
   stays server-side and never enters the browser.

   Run:   node app/proxy.js        (reads the key from app/.env or ANTHROPIC_API_KEY)
   Then the app auto-detects it, or set it explicitly in ⚙ Setup.               */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const key = (() => {
  try { return fs.readFileSync(path.join(__dirname, ".env"), "utf8").match(/sk-ant-[A-Za-z0-9_-]+/)[0]; }
  catch (e) { return process.env.ANTHROPIC_API_KEY || ""; }
})();
const PORT = process.env.CF_PROXY_PORT || 8787;

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".md": "text/plain" };

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access,anthropic-beta");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  if (req.method === "GET" && req.url === "/health") { console.log(new Date().toISOString(), "→ /health probe"); res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: true, key: !!key })); return; }

  /* Serve the app itself — same origin as the API path, so no CORS/PNA at all. */
  if (req.method === "GET") {
    const clean = decodeURIComponent(req.url.split("?")[0]);
    let file = path.normalize(path.join(__dirname, clean === "/" ? "index.html" : clean));
    if (!file.startsWith(__dirname)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (e, data) => {
      if (e) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
    return;
  }

  if (req.method !== "POST" || !req.url.startsWith("/v1/")) { res.writeHead(404); res.end("not found"); return; }

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    let tag = "";
    try { const b = JSON.parse(body); tag = ` model=${b.model} stream=${!!b.stream} tools=${(b.tools || []).map(t => t.name).join(",") || "none"}`; } catch (e) { }
    console.log(new Date().toISOString(), "→", req.url + tag);
    const up = https.request({
      host: "api.anthropic.com", path: req.url, method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": req.headers["anthropic-version"] || "2023-06-01",
        "x-api-key": key,                      // injected server-side; browser key ignored
        "content-length": body.length
      }
    }, (ur) => {
      res.writeHead(ur.statusCode, { "content-type": ur.headers["content-type"] || "application/json" });
      ur.pipe(res);                            // streams SSE straight through
    });
    up.on("error", (e) => { res.writeHead(502, { "content-type": "application/json" }); res.end(JSON.stringify({ error: { message: "proxy upstream error: " + e.message } })); });
    up.end(body);
  });
}).listen(PORT, () => console.log(`Campaign Factory proxy on http://localhost:${PORT} — key ${key ? "loaded" : "MISSING (set app/.env or ANTHROPIC_API_KEY)"}`));
