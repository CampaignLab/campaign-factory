import { test, expect } from "@playwright/test";

test("operations workspace: local review and demo queue flow", async ({ page }) => {
  await page.goto("/operations");

  await expect(
    page.getByRole("heading", { name: /Turn a brief into campaign operations/i }),
  ).toBeVisible();
  await expect(page.getByText("Demo workspace", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Local fixture state", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Nearby ward parents/ }).click();
  await expect(page.getByRole("heading", { name: /Parent update for nearby ward parents/i })).toBeVisible();

  const subject = page.getByLabel("Subject");
  const message = page.getByLabel("Message");
  await subject.fill("Back the permanent school street before the order lapses");
  await message.fill(
    [
      "Hello,",
      "",
      "Please support making the St John the Baptist school street permanent before the experimental order lapses.",
      "",
      "This demo draft still needs a campaigner to check council timing, order wording, and contact consent before any real outreach is considered.",
      "",
      "Thank you,",
      "Campaign Factory demo workspace",
    ].join("\n"),
  );

  await page.getByRole("button", { name: "preview" }).click();
  await expect(page.getByText("Back the permanent school street before the order lapses")).toBeVisible();
  await expect(page.getByText(/44 ready fixture contacts/)).toBeVisible();

  await page.getByRole("button", { name: "Mark ready for review" }).click();
  await expect(page.getByRole("heading", { name: "Needs human review" })).toBeVisible();

  await page.getByRole("button", { name: "Approve as human reviewer" }).click();
  await expect(page.getByRole("heading", { name: "Approved by human" })).toBeVisible();

  await page.getByRole("button", { name: "Queue locally for demo" }).click();
  await expect(page.getByRole("heading", { name: "Queued for demo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "One local queue item" })).toBeVisible();
  await expect(page.getByText(/It is not connected to an email provider/)).toBeVisible();

  const provider = page.getByRole("button", { name: /Email provider · Coming soon/ });
  await expect(provider).toBeDisabled();
  await expect(provider).toHaveAttribute("aria-describedby", "operations-provider-note");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Queued for demo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "One local queue item" })).toBeVisible();
  await expect(page.getByText("Back the permanent school street before the order lapses")).toBeVisible();

  await page.getByRole("button", { name: "Reset demo state" }).click();
  await expect(page.getByRole("heading", { name: "Draft" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nothing queued yet" })).toBeVisible();
});

test("operations workspace: desktop and narrow layouts avoid horizontal overflow", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/operations");
    await expect(page.getByRole("heading", { name: /Turn a brief into campaign operations/i })).toBeVisible();

    const metrics = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      navScrollWidth: document.querySelector("nav")?.scrollWidth ?? 0,
      navClientWidth: document.querySelector("nav")?.clientWidth ?? 0,
    }));

    expect(metrics.bodyScrollWidth, `body should not overflow at ${viewport.width}px`).toBeLessThanOrEqual(
      metrics.viewportWidth,
    );
    expect(metrics.navScrollWidth, `nav should not overflow at ${viewport.width}px`).toBeLessThanOrEqual(
      metrics.navClientWidth,
    );
  }
});
