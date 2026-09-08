import { test, expect } from "@playwright/test";
import { PUBLIC_CAMPAIGN, FIRST_CARD_TIMEOUT_MS } from "./factory.helpers";

// Public single-campaign intake smoke test. Asserts liveness only (does NOT wait
// for a terminal state). If a cancel control exists it is used; otherwise the
// mock run is left to finish on its own (cheap).
//
// The public route rate-limits per client IP (CF_IP_RUN_CAP, default 3) and per
// session — an intentional anti-abuse control. Locally every request buckets
// under the shared "local" IP, so once the team has used the day's quota this
// test honestly SKIPS (see the 429/503 handling below) rather than pretending to
// pass. On a preview URL with real per-visitor IPs it runs normally.

test("public intake: single campaign starts and comes alive", async ({ page, request }) => {
  await page.goto("/factory");

  await page.locator("#problem").fill(PUBLIC_CAMPAIGN.problem);
  await page.locator("#place").fill(PUBLIC_CAMPAIGN.place);
  // Capture the start response so a shared per-IP cap (429/503) is reported
  // honestly rather than surfacing as a confusing UI failure.
  const startResponse = page.waitForResponse(
    (r) => r.url().includes("/api/factory/runs") && r.request().method() === "POST",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: /Build the campaign|Starting/ }).click();

  const res = await startResponse;
  if (res.status() === 429 || res.status() === 503) {
    test.skip(
      true,
      `public run route returned ${res.status()} (shared per-IP/session cap or capacity) — not a UI defect`,
    );
    return;
  }
  expect(res.status(), "public start should be accepted").toBeLessThan(400);
  const started = (await res.json()) as { campaignId?: string; streamToken?: string };

  try {
    // Redirect to the assembly view.
    await page.waitForURL(/\/factory\/c\/.+/, { timeout: 30_000 });

    // The build bar renders immediately, but liveness requires a folded
    // agent.started event rather than the static "Starting up" placeholder.
    const buildBar = page.locator(".fa-buildbar").first();
    await expect(buildBar).toBeVisible({ timeout: FIRST_CARD_TIMEOUT_MS });
    await expect(buildBar).toContainText(/[1-9]\d* agents? at work/i, {
      timeout: FIRST_CARD_TIMEOUT_MS,
    });

    // The progressive brief renders beneath the live controller.
    await expect(page.locator("section[data-stage]").first()).toBeVisible();
    expect(await page.locator("section[data-stage]").count()).toBeGreaterThanOrEqual(10);
  } finally {
    // Every accepted test run carries its own cancellation credential. Clean
    // it up even when an assertion fails so live-mode checks do not keep
    // spending and mock checks do not leave queue residue.
    if (started.campaignId && started.streamToken) {
      await request
        .post(`/api/factory/runs/${started.campaignId}/cancel`, {
          headers: { "x-factory-stream-token": started.streamToken },
        })
        .catch(() => {});
    }
  }
});
