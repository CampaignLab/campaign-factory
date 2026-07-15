// Durable run queue (ADR 0016): pg-boss in its own `pgboss` schema. One job per
// campaign run. Retry lease + dead-letter configured; on worker restart pg-boss
// re-delivers leased jobs and the graph resumes from its last checkpoint.
// Dead-lettered work becomes a VISIBLE Terminal Gap event, never a hidden item.

import PgBoss from "pg-boss";
import { QUEUE_SCHEMA } from "@web/lib/factory/contracts/tables.js";
import { RUNTIME_LIMITS } from "@web/lib/factory/contracts/limits.js";
import { config, needsSsl, requireDatabaseUrl } from "../config.js";

export const RUN_QUEUE = "campaign-run";
export const RUN_DEAD_QUEUE = "campaign-run-dead";

export interface RunJobData {
  campaignId: string;
  batchId?: string;
}

// Long enough that a full campaign (hard limit 20 min) finishes inside one
// lease, so a healthy long run is never re-delivered as a duplicate.
const JOB_EXPIRE_SECONDS = Math.ceil(RUNTIME_LIMITS.hardCampaignLimitMs / 1000) + 600;

export type RunFn = (data: RunJobData) => Promise<void>;
export type DeadFn = (data: RunJobData, reason: string) => Promise<void>;

let boss: PgBoss | null = null;

export function getBoss(): PgBoss {
  if (!boss) throw new Error("pg-boss not started");
  return boss;
}

export async function startQueue(): Promise<PgBoss> {
  const url = requireDatabaseUrl();
  boss = new PgBoss({
    connectionString: url,
    schema: QUEUE_SCHEMA,
    ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
    max: 5,
    application_name: "campaign-factory-worker-queue",
  });
  boss.on("error", (err) => console.error("[pg-boss] error:", err));
  await boss.start();
  return boss;
}

export async function registerQueues(run: RunFn, dead: DeadFn): Promise<void> {
  const b = getBoss();

  // The dead-letter queue must exist before it is referenced as a deadLetter.
  await b.createQueue(RUN_DEAD_QUEUE, { policy: "standard" });
  await b.createQueue(RUN_QUEUE, {
    policy: "standard",
    retryLimit: 3,
    retryDelay: 5,
    retryBackoff: true,
    expireInSeconds: JOB_EXPIRE_SECONDS,
    deadLetter: RUN_DEAD_QUEUE,
  });

  // Main worker: up to 5 campaigns concurrently (a presenter batch). Each job is
  // isolated — the runner always drives its run to a terminal state and only
  // THROWS on systemic failure, which surfaces to pg-boss retry/dead-letter.
  await b.work<RunJobData>(
    RUN_QUEUE,
    { batchSize: RUNTIME_LIMITS.campaignsPerPresenterBatch },
    async (jobs) => {
      const results = await Promise.allSettled(jobs.map((j) => run(j.data)));
      const firstReject = results.find((r) => r.status === "rejected");
      if (firstReject && firstReject.status === "rejected") {
        // Fail the batch so leased jobs are retried / eventually dead-lettered.
        throw firstReject.reason instanceof Error
          ? firstReject.reason
          : new Error(String(firstReject.reason));
      }
    },
  );

  // Dead-letter drain: turn a give-up into a visible Terminal Gap, not silence.
  await b.work<RunJobData>(RUN_DEAD_QUEUE, { batchSize: 5 }, async (jobs) => {
    for (const j of jobs) {
      try {
        await dead(j.data, "Run dead-lettered after exhausting retries");
      } catch (err) {
        console.error("[pg-boss] dead-letter handler error:", err);
      }
    }
  });
}

export async function enqueueRun(data: RunJobData): Promise<string | null> {
  return getBoss().send(RUN_QUEUE, data, {
    // One live job per campaign — a duplicate start collapses onto the same key.
    singletonKey: data.campaignId,
    expireInSeconds: JOB_EXPIRE_SECONDS,
  });
}

// Cancel a still-queued (not yet active) job. A running job is stopped in-process
// via the abort controller + DB status; this just avoids a wasted pickup.
export async function cancelQueuedRun(campaignId: string): Promise<void> {
  const b = getBoss();
  try {
    const job = await b.getJobById(RUN_QUEUE, campaignId);
    if (job && (job.state === "created" || job.state === "retry")) {
      await b.cancel(RUN_QUEUE, job.id);
    }
  } catch {
    /* best-effort; graph-level cancellation is authoritative */
  }
}

export async function stopQueue(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, wait: false });
    boss = null;
  }
  void config;
}
