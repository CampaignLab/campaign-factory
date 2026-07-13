// Dev/admin helper: opt a run into the Campaign Gallery (shared=true + title) or
// delete it, directly against the configured DB. Reads DATABASE_URL from .env.local.
//   node scripts/gallery.mjs share <runId> "Gallery title"
//   node scripts/gallery.mjs delete <runId>
import postgres from "postgres";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: /neon\.tech|sslmode=require/.test(url) ? "require" : false });

const [cmd, id, title] = process.argv.slice(2);
if (cmd === "share") {
  const r = await sql`update runs set shared = true, wall_title = ${title ?? null} where id = ${id}`;
  console.log(r.count ? `shared: ${id} — "${title ?? "(campaign name)"}"` : `not found: ${id}`);
} else if (cmd === "delete") {
  const r = await sql`delete from runs where id = ${id}`;
  console.log(r.count ? `deleted: ${id}` : `not found: ${id}`);
} else {
  console.log("usage: gallery.mjs share <id> \"title\" | delete <id>");
}
await sql.end();
