// Dev helper: seed the local DB with the real campaign fixture as a completed
// run row, so /c/[id] can be verified rendering real data straight from Postgres.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const sql = postgres(process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5433/campaign_factory", { ssl: false });

const campaign = JSON.parse(readFileSync(new URL("../src/lib/dev/sample-campaign.json", import.meta.url), "utf8"));
const id = /^[0-9a-f-]{36}$/i.test(campaign.id || "") ? campaign.id : randomUUID();
campaign.id = id;

await sql`
  create table if not exists runs (
    id uuid primary key, status text not null, stages jsonb not null, notes jsonb not null,
    campaign jsonb not null, cost_usd numeric not null default 0, shared boolean not null default false,
    wall_title text, hidden boolean not null default false,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
  )`;

await sql`
  insert into runs (id, status, stages, notes, campaign, cost_usd)
  values (${id}, 'complete', ${sql.json({ research: { status: "done" }, plan: { status: "done" }, drafts: { status: "done" }, lint: { status: "done" } })}, ${sql.json([])}, ${sql.json(campaign)}, 0)
  on conflict (id) do update set campaign = excluded.campaign, status = 'complete'
`;

console.log("seeded run id:", id);
await sql.end();
