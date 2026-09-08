// POST /api/factory/workflow-runs — start a campaign on the VERCEL WORKFLOW
// executor (migration phase 2, docs/product/vercel-workflow-migration.md).
// Mirrors the worker's handleStartRun creation sequence exactly — createRun
// (status "queued", meta.profile) then the run.queued event, in that order,
// BEFORE starting the workflow (appendEvent throws without the run row, and
// the route must return campaignId synchronously) — then start() replaces
// pg-boss enqueueRun. House-key runs only (no BYOK on this path — a visitor
// key must never ride through workflow arguments, which persist unsealed).
//
// Gated by WORKFLOW_SPIKE_SECRET (preview-only env; unset = dead route): this
// is the phase-2/3 verification surface, not a public entrypoint. Cutover
// happens later inside /api/factory/runs behind a flag, with the existing
// budget/cap gates in front.
//
// streamToken/streamUrl are returned empty: useFactoryRun treats them as
// optional and falls back to 2.5s polling of GET /api/factory/runs/[id],
// which reads Postgres directly — no worker, no SSE dependency.

import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { campaignWorkflow, type CampaignSeed } from "@/workflows/campaign";
import { sql } from "@/lib/factory/exec/db";
import * as store from "@/lib/factory/exec/store";
import { factoryEnvId } from "../_lib/worker";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = (process.env.WORKFLOW_SPIKE_SECRET || "").trim();
  return !!secret && (req.headers.get("x-spike-secret") || "").trim() === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "not found" }, { status: 404 });

  const b = (await req.json().catch(() => ({}))) as {
    problem?: unknown;
    place?: unknown;
    profile?: unknown;
  };
  const problem = typeof b.problem === "string" ? b.problem.trim() : "";
  const place = typeof b.place === "string" ? b.place.trim() : "";
  if (!problem || !place) {
    return NextResponse.json({ error: "problem and place are required" }, { status: 400 });
  }
  if (b.profile !== undefined && b.profile !== "full" && b.profile !== "express") {
    return NextResponse.json({ error: "profile must be 'full' or 'express'" }, { status: 400 });
  }
  const profile = (b.profile as "full" | "express" | undefined) ?? "express";

  const s = sql();
  const campaignId = await store.createRun(s, {
    environmentId: factoryEnvId(),
    mode: "public",
    problem,
    place,
    status: "queued",
    // executor marker is observability-only; the runner reads meta.profile.
    meta: { profile, executor: "workflow" },
  });
  await store.appendEvent(s, {
    campaignId,
    type: "run.queued",
    visibility: "public",
    payload: { summary: `Run queued (${profile})`, detail: { profile } },
  });

  const seed: CampaignSeed = { campaignId, mode: "public", profile, problem, place };
  const run = await start(campaignWorkflow, [seed]);

  return NextResponse.json(
    { campaignId, streamToken: "", streamUrl: "", workflowRunId: run.runId },
    { status: 202 },
  );
}
