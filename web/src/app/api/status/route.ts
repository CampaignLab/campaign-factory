import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { overBudget } from "@/lib/db/spend";
import { runCount } from "@/lib/db/sessions";
import { parseSid } from "@/lib/session";
import type { StatusResp } from "@/lib/client/api";

// GET /api/status — what the client needs to decide whether to show the entry
// form, prompt for an access code, or show the "we're at capacity" page.
export async function GET(req: Request) {
  const sid = parseSid(req.headers.get("cookie"));
  const used = sid ? await runCount(sid) : 0;
  const over = await overBudget();
  const capacity = config.readonly || over;
  const resp: StatusResp = {
    accessRequired: !!config.accessCode,
    readonly: config.readonly,
    capacity,
    reason: config.readonly ? "closed" : over ? "budget" : null,
    runCap: config.runCap,
    runsUsed: used,
    runsRemaining: Math.max(0, config.runCap - used),
  };
  return NextResponse.json(resp);
}
