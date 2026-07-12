/* Campaign Factory — tiny local server: static app + Anthropic API proxy.

   Why: browser-direct calls to api.anthropic.com require the key's organisation
   to allow CORS; ours doesn't ("API 401: CORS requests are not allowed for this
   Organization"). Proxying same-origin removes the CORS requirement entirely and
   keeps the API key out of the browser (it stays in app/.env, server-side).

   Zero dependencies (Node 18+). Run:  node app/server.mjs  → http://localhost:8787

   Endpoints:
     GET  /api/health    → { ok, live }  (live = a key is configured server-side)
     POST /api/messages  → forwarded to https://api.anthropic.com/v1/messages,
                           response (including SSE stream) piped back verbatim
     everything else     → static files from app/

   Binds to 127.0.0.1 only — the proxy must not be reachable from the room's wifi. */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const API = "https://api.anthropic.com/v1/messages";

function loadKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY.trim();
  try {
    const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    const m = env.match(/^\s*ANTHROPIC_API_KEY\s*=\s*"?([^"\n\r]+)"?\s*$/m);
    if (m) return m[1].trim();
  } catch (e) { /* no .env — health reports live:false */ }
  return "";
}
const KEY = loadKey();

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8"
};

function sendJSON(res, status, obj) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

async function proxy(req, res) {
  if (!KEY) return sendJSON(res, 503, { error: { message: "No ANTHROPIC_API_KEY configured on the server — add it to app/.env and restart." } });
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  let upstream;
  try {
    upstream = await fetch(API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01"
      },
      body
    });
  } catch (e) {
    return sendJSON(res, 502, { error: { message: "Could not reach api.anthropic.com: " + e.message } });
  }
  res.writeHead(upstream.status, { "content-type": upstream.headers.get("content-type") || "application/json" });
  if (!upstream.body) return res.end();
  // pipe verbatim — works for both SSE streams and plain JSON error bodies
  const reader = upstream.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } catch (e) { /* client disconnected or upstream dropped — nothing to salvage */ }
  res.end();
}

function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return sendJSON(res, 403, { error: { message: "Forbidden" } });
  fs.readFile(file, (err, data) => {
    if (err) {
      // optional files (local-key.js) 404 harmlessly, same as before
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("Not found");
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}

http.createServer((req, res) => {
  if (req.url.startsWith("/api/health")) return sendJSON(res, 200, { ok: true, live: !!KEY });
  if (req.url.startsWith("/api/messages") && req.method === "POST") return void proxy(req, res);
  if (req.method !== "GET") return sendJSON(res, 405, { error: { message: "Method not allowed" } });
  serveStatic(req, res);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Campaign Factory  →  http://localhost:${PORT}`);
  console.log(KEY ? "Live mode: key loaded from app/.env (server-side; never sent to the browser)."
                  : "No key found in app/.env — app will run in simulated mode (or paste a key in ⚙ Setup for browser-direct calls).");
});
