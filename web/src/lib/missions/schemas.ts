export const WORKER_REPORT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    assessment: { type: "string", enum: ["supports_viability", "concern", "blocking", "uncertain"] },
    summary: { type: "string" },
    findings: {
      type: "array",
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          finding: { type: "string" },
          evidenceRefs: { type: "array", items: { type: "string" } },
          basis: { type: "string", enum: ["evidence", "inference", "unknown"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          implication: { type: "string" },
        },
        required: ["finding", "evidenceRefs", "basis", "confidence", "implication"],
      },
    },
    conditions: { type: "array", maxItems: 6, items: { type: "string" } },
    openQuestions: { type: "array", maxItems: 6, items: { type: "string" } },
  },
  required: ["assessment", "summary", "findings", "conditions", "openQuestions"],
};

export const TRIBUNAL_RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["viable", "viable_with_changes", "uncertain", "not_currently_viable"] },
    executiveSummary: { type: "string" },
    rationale: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          point: { type: "string" },
          evidenceRefs: { type: "array", items: { type: "string" } },
          basis: { type: "string", enum: ["evidence", "inference", "unknown"] },
        },
        required: ["point", "evidenceRefs", "basis"],
      },
    },
    agreements: { type: "array", maxItems: 6, items: { type: "string" } },
    disagreements: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          issue: { type: "string" },
          positions: { type: "array", items: { type: "string" } },
          chairAssessment: { type: "string" },
        },
        required: ["issue", "positions", "chairAssessment"],
      },
    },
    failureConditions: { type: "array", maxItems: 8, items: { type: "string" } },
    recommendedChanges: { type: "array", maxItems: 8, items: { type: "string" } },
    localKnowledgeQuestions: { type: "array", maxItems: 8, items: { type: "string" } },
    limitations: { type: "array", maxItems: 6, items: { type: "string" } },
    evidenceRefs: { type: "array", items: { type: "string" } },
  },
  required: [
    "verdict",
    "executiveSummary",
    "rationale",
    "agreements",
    "disagreements",
    "failureConditions",
    "recommendedChanges",
    "localKnowledgeQuestions",
    "limitations",
    "evidenceRefs",
  ],
};
