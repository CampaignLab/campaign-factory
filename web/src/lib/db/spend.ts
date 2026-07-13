import { sql, migrate } from "./client";
import { dailyBudgetUSD } from "@/lib/config";

// Durable daily spend ledger (replaces the in-memory shim). Keyed by UTC date.
export async function addSpend(usd: number): Promise<void> {
  if (!Number.isFinite(usd) || usd <= 0) return;
  await migrate();
  await sql`
    insert into spend_ledger (day, usd) values (current_date, ${usd})
    on conflict (day) do update set usd = spend_ledger.usd + excluded.usd
  `;
}

export async function spentTodayUSD(): Promise<number> {
  await migrate();
  const rows = await sql`select usd from spend_ledger where day = current_date`;
  return rows[0] ? Number(rows[0].usd) : 0;
}

export async function overBudget(): Promise<boolean> {
  return (await spentTodayUSD()) >= dailyBudgetUSD();
}

export async function budgetSnapshot() {
  const spent = await spentTodayUSD();
  const cap = dailyBudgetUSD();
  const round = (n: number) => Math.round(n * 100) / 100;
  return { spentUSD: round(spent), capUSD: round(cap), remainingUSD: round(Math.max(0, cap - spent)), over: spent >= cap };
}
