import { type VerificationLabel } from "@/lib/pipeline/labels";

// Colour language for the seven verification labels. Verified = green;
// inference/recommendation = cooler; assumption/conflict = warm/alarm;
// unavailable/incomplete = muted. This chip is the product's honesty made visible.
const STYLES: Record<VerificationLabel, string> = {
  "Verified public information": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "Supported inference": "bg-sky-100 text-sky-900 border-sky-300",
  "Generated campaign recommendation": "bg-violet-100 text-violet-900 border-violet-300",
  "Campaign assumption": "bg-amber-100 text-amber-900 border-amber-300",
  "Conflicting evidence": "bg-red-100 text-red-900 border-red-300",
  "Verification incomplete": "bg-zinc-100 text-zinc-700 border-zinc-300",
  "External information unavailable": "bg-zinc-100 text-zinc-600 border-zinc-300",
};

const SHORT: Record<VerificationLabel, string> = {
  "Verified public information": "Verified",
  "Supported inference": "Inferred",
  "Generated campaign recommendation": "Recommended",
  "Campaign assumption": "Assumption",
  "Conflicting evidence": "Conflicting",
  "Verification incomplete": "Unverified",
  "External information unavailable": "Unavailable",
};

export function LabelChip({ label, short = false }: { label: VerificationLabel; short?: boolean }) {
  const cls = STYLES[label] ?? STYLES["Verification incomplete"];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
      title={label}
    >
      {short ? SHORT[label] ?? label : label}
    </span>
  );
}
