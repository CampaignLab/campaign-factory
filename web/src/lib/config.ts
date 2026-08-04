// Runtime configuration for the launch controls. All tunable via env so the
// numbers can change the week before the conference without a redeploy of logic.

function numEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v == null || v.trim() === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function intEnv(name: string, fallback: number): number {
  return Math.trunc(numEnv(name, fallback));
}
function boolEnv(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v == null) return fallback;
  return /^(1|true|yes|on)$/i.test(v.trim());
}

export const config = {
  // Conference access code. Empty string = gate disabled (local dev).
  accessCode: (process.env.CF_ACCESS_CODE || "").trim(),
  // Runs allowed per browser session (cookie — easy to reset by clearing cookies).
  // Conference day (16 Jul): effectively uncapped per person (user decision) —
  // queue fairness and the daily kill-switch are the operative controls.
  runCap: intEnv("CF_RUN_CAP", 200),
  // Runs allowed per client IP (harder backstop against abuse). Set to 1 for
  // "everyone gets one run". Cost is controlled here, not by degrading research.
  // venue NAT: hundreds of attendees share one egress IP — default high so the
  // whole room isn't locked out by one shared address (env var still overrides).
  ipRunCap: intEnv("CF_IP_RUN_CAP", 200),
  // Global daily spend ceiling (kill-switch), in GBP, converted to USD for the
  // ledger. Zero or negative DISABLES the kill-switch. History: £150 at launch;
  // ≈$600 conference day 16 Jul; OFF 21 Jul (free-access-code launch); re-armed
  // 4 Aug 2026 at £78.74 ≈ $100/day via the Vercel env var (user decision —
  // BYOK now optional, so the house key funds public runs again). Per-campaign
  // COST_GUARDS on the worker and the session/IP run caps back this up.
  dailyBudgetGBP: numEnv("CF_DAILY_BUDGET_GBP", 472.44),
  fxGbpUsd: numEnv("CF_FX_GBP_USD", 1.27),
  // Sunset / maintenance switch — disables new runs, existing URLs stay readable.
  readonly: boolEnv("CF_READONLY", false),
  // Admin secret for the wall hide control. Empty = admin actions disabled.
  adminKey: (process.env.CF_ADMIN_KEY || "").trim(),
};

export function dailyBudgetUSD(): number {
  return config.dailyBudgetGBP * config.fxGbpUsd;
}

// A request is admin iff an admin key is configured AND the caller's
// x-cf-admin-key header matches it exactly (trimmed). Header-only by design —
// surfaces that accept the key via ?key= or a body field must not use this.
export function isAdminRequest(req: Request): boolean {
  return !!config.adminKey && (req.headers.get("x-cf-admin-key") || "").trim() === config.adminKey;
}
