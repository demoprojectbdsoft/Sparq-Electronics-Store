// ─── Warranty wording shared by the customer and admin screens ───────────────
// The server stores short codes; these helpers turn them into readable text so
// both dashboards always describe a warranty the same way.

/** Problems a customer can pick when filing a claim. */
export const CLAIM_PROBLEM_OPTIONS = [
  { value: "not_working", label: "Not turning on / not working" },
  { value: "stopped_working", label: "Stopped working after some time" },
  { value: "damaged_on_arrival", label: "Damaged on arrival" },
  { value: "battery_issue", label: "Battery or charging problem" },
  { value: "display_issue", label: "Screen or display problem" },
  { value: "missing_parts", label: "Missing parts or accessories" },
  { value: "other", label: "Other problem" },
] as const;

export type ClaimProblemValue = (typeof CLAIM_PROBLEM_OPTIONS)[number]["value"];

/** Friendly name for a warranty type stored on the product. */
export function warrantyTypeLabel(type?: string): string {
  switch (type) {
    case "manufacturer-warranty":
      return "Manufacturer";
    case "seller-warranty":
      return "Seller";
    case "extended-warranty":
      return "Extended";
    case "other":
      return "Other";
    case "none":
      return "No warranty";
    default:
      return "—";
  }
}

/** Friendly name for a claim problem code. */
export function claimProblemLabel(value?: string): string {
  if (!value) return "—";
  const match = CLAIM_PROBLEM_OPTIONS.find((option) => option.value === value);
  // Unknown codes fall back to the raw value with underscores removed, so an
  // older record never shows an empty cell.
  return match?.label || value.replace(/_/g, " ");
}

/** "12" → "12 months", "1" → "1 month", missing → "—". */
export function formatWarrantyDuration(months?: number): string {
  if (!months || months <= 0) return "—";
  return `${months} month${months === 1 ? "" : "s"}`;
}
