import { type MissionSpecification } from "./registry";
import { type MissionResult, type MissionStatus } from "./types";

export function workerOutcomeStatus(successful: number, total: number, minimum: number): Extract<MissionStatus, "complete" | "partial" | "failed"> {
  if (successful < minimum) return "failed";
  return successful === total ? "complete" : "partial";
}

export function validateSynthesis(specification: MissionSpecification, value: unknown): MissionResult {
  return specification.synthesisSchema.parse(value);
}
