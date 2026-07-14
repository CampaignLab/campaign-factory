import { describe, expect, it } from "vitest";
import { campaignHasActiveMission } from "@/lib/db/mission-rows";
import { type MissionRunSummary } from "./types";

function run(status: MissionRunSummary["status"], missionType: MissionRunSummary["missionType"]): MissionRunSummary {
  return {
    id: crypto.randomUUID(),
    campaignId: "11111111-1111-4111-8111-111111111111",
    missionType,
    status,
    reviewState: "unreviewed",
    createdAt: "2026-07-14T10:00:00Z",
  };
}

describe("campaign-wide active mission gate", () => {
  it("blocks a different mission type while any campaign mission is queued or running", () => {
    expect(campaignHasActiveMission([run("running", "viability_tribunal")])).toBe(true);
    expect(campaignHasActiveMission([run("queued", "evidence_audit")])).toBe(true);
    expect(campaignHasActiveMission([run("complete", "viability_tribunal"), run("failed", "precedent_review")])).toBe(false);
  });
});
