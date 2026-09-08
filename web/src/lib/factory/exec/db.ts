// Postgres client for Workflow-executed runs. One pooled client per function
// instance (module scope survives across step invocations under Fluid), built
// from FACTORY_DATABASE_URL — the same database the worker writes and the web
// read paths (getRunReadModel, gallery) already read. Falls back to
// DATABASE_URL when the factory URL is not split out (local dev).

import postgres from "postgres";
import { needsSsl } from "@/lib/db/ssl";

export type Sql = ReturnType<typeof postgres>;

let client: Sql | null = null;

export function sql(): Sql {
  if (client) return client;
  const url = (process.env.FACTORY_DATABASE_URL || process.env.DATABASE_URL || "").trim();
  if (!url) throw new Error("FACTORY_DATABASE_URL / DATABASE_URL is not set");
  client = postgres(url, { ssl: needsSsl(url) ? "require" : false, max: 5, idle_timeout: 20 });
  return client;
}
