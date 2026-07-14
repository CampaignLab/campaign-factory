import { NextResponse } from "next/server";
import { reviewMissionRun } from "@/lib/db/missions";
import { parseSid } from "@/lib/session";
import { type ReviewState } from "@/lib/missions/types";

const ALLOWED = new Set<Exclude<ReviewState, "unreviewed">>(["reviewed", "rejected", "needs_local_knowledge"]);

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ missionRunId: string }> }) {
  const { missionRunId } = await ctx.params;
  const sid = parseSid(req.headers.get("cookie"));
  if (!sid) return NextResponse.json({ error: "Only the campaign owner can record a review decision." }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const reviewState = (body as { reviewState?: unknown })?.reviewState;
  if (typeof reviewState !== "string" || !ALLOWED.has(reviewState as Exclude<ReviewState, "unreviewed">)) {
    return NextResponse.json({ error: "Invalid review decision" }, { status: 400 });
  }
  const updated = await reviewMissionRun(missionRunId, sid, reviewState as Exclude<ReviewState, "unreviewed">);
  if (!updated) return NextResponse.json({ error: "Mission not found, incomplete, or not owned by this session." }, { status: 403 });
  return NextResponse.json({ ok: true, reviewState });
}
