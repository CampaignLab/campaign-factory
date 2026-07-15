// W6 documents domain — the deterministic nine-document compiler, the Evidence
// and Next Checks builder, and the receipt builders. All runtime-neutral (no
// next/*): the worker's finalisation node and the web UI import from here alike.

export {
  compileDocuments,
  sectionDocStatus,
  isExportable,
  DOC_SECTIONS,
  type CompiledDocument,
} from "./compile";

export {
  buildEvidenceAndNextChecks,
  evidenceSection,
  type EvidenceAndNextChecks,
  type SourceLedgerGroup,
  type EvidenceClaimView,
  type EvidenceTotals,
} from "./evidence";

export {
  buildCampaignReceipt,
  buildBatchReceipt,
  isSubstantiallyUsable,
  type CampaignReceipt,
  type BatchReceipt,
  type BatchReceiptCampaignInput,
  type BatchReceiptTotals,
  type AgentTally,
  type ClaimTally,
  type JudgementTally,
} from "./receipts";

export {
  LABEL_TAG_CLASS,
  UNRESOLVED_LABELS,
  isUnresolvedLabel,
  escapeHtml,
  type Block,
} from "./render";
