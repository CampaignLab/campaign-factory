import { sql, migrate } from "./client";

// Durable per-session run counter (replaces the in-memory shim). Keyed by the
// anonymous cf_sid cookie.
export async function runCount(sid: string): Promise<number> {
  await migrate();
  const rows = await sql`select run_count from sessions where sid = ${sid}`;
  return rows[0] ? Number(rows[0].run_count) : 0;
}

export async function incrRun(sid: string): Promise<void> {
  await migrate();
  await sql`
    insert into sessions (sid, run_count, updated_at) values (${sid}, 1, now())
    on conflict (sid) do update set run_count = sessions.run_count + 1, updated_at = now()
  `;
}
