// Model-provider error taxonomy — the ONE place that knows which failures are
// retryable and how to pace retries. Consumed by the executor's full 3-rung
// ladder and by the reviewer's deliberately-cheaper single retry, so the two
// paths can never disagree about what an overload or a dead key looks like.
// (Architecture review 2026-07-20, W6.)

export const OVERLOAD_MAX_WAIT_MS = 20_000;

export function isOverloadError(e: unknown): boolean {
  const err = e as { status?: unknown; error?: { type?: unknown }; message?: unknown } | null;
  const status = typeof err?.status === "number" ? err.status : undefined;
  const type = err?.error && typeof err.error === "object" ? (err.error as { type?: unknown }).type : undefined;
  if (status === 429 || status === 529 || type === "rate_limit_error" || type === "overloaded_error") return true;
  // Observed 16 Jul (Sonnet incident): the client wrapper rethrows a plain
  // Error whose MESSAGE is the raw JSON body ({"type":"overloaded_error",...},
  // status undefined) — detect that shape too.
  const msg = typeof err?.message === "string" ? err.message : "";
  return msg.includes('"overloaded_error"') || msg.includes('"rate_limit_error"');
}

// Auth/credit failures are NON-retryable: a rejected, revoked, or
// out-of-credits key (Anthropic 401; OpenRouter 401/402/403 on BYOK runs)
// fails identically on every rung, and a cross-model fallback would burn the
// same dead key. Callers should fail the turn immediately with an honest gap.
export function isKeyOrCreditError(e: unknown): boolean {
  const err = e as { status?: unknown; message?: unknown } | null;
  const status = typeof err?.status === "number" ? err.status : undefined;
  if (status === 401 || status === 402 || status === 403) return true;
  const msg = typeof err?.message === "string" ? err.message : "";
  return msg.includes('"authentication_error"') || msg.includes("Insufficient credits");
}

export function overloadWaitMs(e: unknown): number {
  const headers = (e as { headers?: unknown })?.headers;
  const raw =
    headers && typeof (headers as { get?: unknown }).get === "function"
      ? (headers as { get: (k: string) => string | null }).get("retry-after")
      : headers && typeof headers === "object"
        ? (headers as Record<string, string>)["retry-after"]
        : undefined;
  const retryAfterMs = raw ? Number(raw) * 1000 : NaN;
  const jitteredMs = 5_000 + Math.random() * 10_000;
  const wait = Number.isFinite(retryAfterMs) && retryAfterMs > 0 ? retryAfterMs : jitteredMs;
  return Math.min(Math.max(wait, 1_000), OVERLOAD_MAX_WAIT_MS);
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
