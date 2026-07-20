// Worker store barrel. The factory persistence layer is OWNED by w1-db
// (web/src/lib/factory/store/** + state/reducer.ts, schema in
// db/factory/migrations); the worker injects its own DIRECT/unpooled `sql`
// client into those functions. Everything web-side flows through unchanged —
// the previous hand-maintained re-export list kept drifting (product code
// bypassed it for functions it forgot; architecture review 2026-07-20, W7).
// The worker-only readiness probes below are this barrel's real value-add.

export * from "@web/lib/factory/store/index.js";
export * from "@web/lib/factory/state/reducer.js";

// Environment Identity Check (ADR 0014) — w1-db's authoritative fail-closed
// implementation. assertEnvironmentIdentity reads FACTORY_ENV_ID from env.
export {
  assertEnvironmentIdentity,
  seedEnvironmentIdentity,
  getEnvironmentIdentity,
} from "@web/lib/factory/env-identity.js";

// ---- Worker-only readiness probes ----

import type { Sql } from "../db/pool.js";
import { FACTORY_SCHEMA } from "@web/lib/factory/contracts/tables.js";

export async function pingDb(sql: Sql): Promise<void> {
  await sql`select 1`;
}
export async function factorySchemaReady(sql: Sql): Promise<boolean> {
  const rows = await sql<{ reg: string | null }[]>`select to_regclass(${`${FACTORY_SCHEMA}.factory_events`}) as reg`;
  return rows[0]?.reg != null;
}
export async function checkpointSchemaReady(sql: Sql): Promise<boolean> {
  const rows = await sql<{ reg: string | null }[]>`select to_regclass('lg.checkpoints') as reg`;
  return rows[0]?.reg != null;
}
export async function queueSchemaReady(sql: Sql): Promise<boolean> {
  const rows = await sql<{ reg: string | null }[]>`select to_regclass('pgboss.job') as reg`;
  return rows[0]?.reg != null;
}
