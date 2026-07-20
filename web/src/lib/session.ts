// Cookie helpers for the anonymous browser session. The run-count itself is now
// durable in Postgres — see @/lib/db/sessions.
import { randomUUID } from "node:crypto";

export const SID_COOKIE = "cf_sid";

// Parse a single cookie value from a raw Cookie header. Generic over the
// cookie name; parseSid is the cf_sid-specific reader on top of it.
export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

export function parseSid(cookieHeader: string | null): string | null {
  return readCookie(cookieHeader, SID_COOKIE) ?? null;
}

export function newSid(): string {
  return randomUUID();
}

// Best-effort client IP for the per-IP run cap. On Vercel the real client IP is
// the first entry of x-forwarded-for.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "local";
}
