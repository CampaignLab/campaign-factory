import postgres from "postgres";

// Portable Postgres client (works against local Docker and Neon alike — Neon
// takes a standard connection string). Singleton across dev hot-reloads to avoid
// exhausting connections.
const url = process.env.DATABASE_URL;

const g = globalThis as unknown as { __cf_sql?: ReturnType<typeof postgres> };

function make() {
  if (!url) throw new Error("DATABASE_URL is not set");
  const needsSsl = /neon\.tech|sslmode=require/.test(url) || process.env.PGSSL === "require";
  return postgres(url, { ssl: needsSsl ? "require" : false, max: 10, idle_timeout: 20 });
}

export const sql = g.__cf_sql ?? (g.__cf_sql = make());

// Idempotent schema. Run once per process before the first query.
let migrated: Promise<void> | null = null;
export function migrate(): Promise<void> {
  return (migrated ??= (async () => {
    await sql`
      create table if not exists runs (
        id uuid primary key,
        status text not null,
        stages jsonb not null,
        notes jsonb not null,
        campaign jsonb not null,
        cost_usd numeric not null default 0,
        owner_sid text,
        shared boolean not null default false,
        wall_title text,
        hidden boolean not null default false,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )`;
    // idempotent add for DBs created before owner tracking
    await sql`alter table runs add column if not exists owner_sid text`;
    await sql`create index if not exists runs_wall_idx on runs (shared, hidden, updated_at desc)`;
    await sql`
      create table if not exists spend_ledger (
        day date primary key,
        usd numeric not null default 0
      )`;
    await sql`
      create table if not exists sessions (
        sid text primary key,
        run_count int not null default 0,
        updated_at timestamptz not null default now()
      )`;
    await sql`
      create table if not exists ip_usage (
        ip text primary key,
        run_count int not null default 0,
        updated_at timestamptz not null default now()
      )`;
    await sql`
      create table if not exists mission_runs (
        id uuid primary key,
        campaign_id uuid not null references runs(id) on delete cascade,
        mission_type text not null,
        status text not null,
        campaign_snapshot jsonb not null,
        snapshot_hash text not null,
        worker_reports jsonb not null default '[]'::jsonb,
        result jsonb,
        error text,
        cost_usd numeric not null default 0,
        review_state text not null default 'unreviewed',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        completed_at timestamptz
      )`;
    await sql`
      create table if not exists mission_events (
        id bigserial primary key,
        mission_run_id uuid not null references mission_runs(id) on delete cascade,
        kind text not null,
        agent_key text,
        label text not null,
        detail text,
        created_at timestamptz not null default now()
      )`;
    await sql`create index if not exists mission_runs_campaign_idx on mission_runs (campaign_id, created_at desc)`;
    await sql`create index if not exists mission_events_run_idx on mission_events (mission_run_id, id)`;
    // Mission Bay permits one active mission across the whole campaign. Create
    // the stronger index under a new name before removing the earlier per-type
    // index, so repeated cold-start migrations never open a constraint gap.
    await sql`
      create unique index if not exists mission_one_active_campaign_idx
      on mission_runs (campaign_id)
      where status in ('queued', 'running')`;
    await sql`drop index if exists mission_one_active_idx`;
  })());
}
