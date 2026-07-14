import { describe, expect, it } from "vitest";
import { MISSION_REGISTRY, validateMissionRegistry } from "./registry";
import { validateSynthesis, workerOutcomeStatus } from "./runtime-validation";

describe("mission registry", () => {
  it("registers the four runnable missions with valid worker thresholds", () => {
    expect(validateMissionRegistry()).toEqual([]);
    expect(Object.keys(MISSION_REGISTRY)).toEqual([
      "viability_tribunal",
      "evidence_audit",
      "decision_route_audit",
      "precedent_review",
    ]);
    for (const mission of Object.values(MISSION_REGISTRY)) {
      expect(mission.minimumSuccessfulWorkers).toBeGreaterThan(0);
      expect(mission.minimumSuccessfulWorkers).toBeLessThanOrEqual(mission.agents.length);
      expect(mission.workerJsonSchema.type).toBe("object");
      expect(mission.synthesisJsonSchema.type).toBe("object");
    }
  });

  it("classifies full, partial and below-threshold worker outcomes", () => {
    expect(workerOutcomeStatus(4, 4, 2)).toBe("complete");
    expect(workerOutcomeStatus(3, 4, 2)).toBe("partial");
    expect(workerOutcomeStatus(1, 4, 2)).toBe("failed");
  });

  it("fails synthesis that does not match the mission result schema", () => {
    expect(() => validateSynthesis(MISSION_REGISTRY.viability_tribunal, {
      missionType: "viability_tribunal",
      executiveSummary: "Missing the required verdict and result sections",
    })).toThrow();
  });
});
