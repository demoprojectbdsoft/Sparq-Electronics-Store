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

/**
 * Every warranty type the server can store, with the words both dashboards use.
 * Kept in step with `warranty.types.ts` on the server, so the store never
 * promises one thing in a form and another thing in an email.
 */
export const WARRANTY_TYPE_OPTIONS = [
  {
    value: "manufacturer-warranty",
    label: "Manufacturer warranty",
    short: "Manufacturer",
    coveredBy: "The brand",
    customerAction:
      "Send us the claim and we forward it to the brand's service centre.",
    hasCoverage: true,
  },
  {
    value: "seller-warranty",
    label: "Seller warranty",
    short: "Seller",
    coveredBy: "The store",
    customerAction: "Send us the claim and we repair or replace the item ourselves.",
    hasCoverage: true,
  },
  {
    value: "extended-warranty",
    label: "Extended warranty",
    short: "Extended",
    coveredBy: "The store, under the plan",
    customerAction: "Send us the claim and we handle it under the extended plan.",
    hasCoverage: true,
  },
  {
    value: "other",
    label: "Other warranty",
    short: "Other",
    coveredBy: "Per the terms below",
    customerAction: "Read the warranty terms below before filing a claim.",
    hasCoverage: true,
  },
  {
    value: "none",
    label: "No warranty",
    short: "No warranty",
    coveredBy: "Nobody",
    customerAction: "This item was sold without warranty, so no claim can be filed.",
    hasCoverage: false,
  },
] as const;

export type WarrantyTypeValue = (typeof WARRANTY_TYPE_OPTIONS)[number]["value"];

export type WarrantyTypeInfo = (typeof WARRANTY_TYPE_OPTIONS)[number];

/** The entry for "other", used when an old record holds an unknown code. */
const OTHER_WARRANTY = WARRANTY_TYPE_OPTIONS[3];

/**
 * Look a warranty type up. An unknown or missing code reads as "Other warranty"
 * instead of leaving an empty cell on the screen.
 */
export function warrantyTypeInfo(type?: string | null): WarrantyTypeInfo {
  return (
    WARRANTY_TYPE_OPTIONS.find((option) => option.value === type) || OTHER_WARRANTY
  );
}

/** Friendly name for a warranty type stored on the product. */
export function warrantyTypeLabel(type?: string): string {
  if (!type) return "—";
  return warrantyTypeInfo(type).short;
}

/** True when the type promises coverage at all, whatever the duration says. */
export function warrantyTypeHasCoverage(type?: string | null): boolean {
  return warrantyTypeInfo(type).hasCoverage;
}

/**
 * Coverage needs both halves of the promise: a type that includes cover and a
 * period to count. The server applies the same rule when it issues a record.
 */
export function hasWarrantyCoverage(
  type?: string | null,
  months?: number | null
): boolean {
  if (!warrantyTypeHasCoverage(type)) return false;
  return Number(months) > 0;
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

/**
 * How many times one warranty may be extended. Mirrors
 * `MAX_WARRANTY_EXTENSIONS` in `warranty.types.ts` on the server, which is the
 * side that actually refuses the fourth extension.
 */
export const MAX_WARRANTY_EXTENSIONS = 3;

/**
 * The only type an admin may lengthen. An Extended warranty exists to run past
 * the manufacturer's own period, so it is the one kind that can be topped up;
 * a manufacturer or seller warranty covers exactly the period it was sold with.
 * Mirrors `EXTENDABLE_WARRANTY_TYPE` in `warranty.types.ts` on the server.
 */
export const EXTENDABLE_WARRANTY_TYPE: WarrantyTypeValue = "extended-warranty";

/** True when an admin may add months to a record of this type. */
export function isExtendableWarrantyType(type?: string | null): boolean {
  return type === EXTENDABLE_WARRANTY_TYPE;
}

/**
 * How many extension slots a record has left. The API sends `extensionsLeft`,
 * but older responses and the customer pages do not, so this is the fallback.
 */
export function extensionSlotsLeft(
  extensions?: { months: number }[] | null,
  extensionsLeft?: number | null
): number {
  if (typeof extensionsLeft === "number") return Math.max(0, extensionsLeft);
  const used = Array.isArray(extensions) ? extensions.length : 0;
  return Math.max(0, MAX_WARRANTY_EXTENSIONS - used);
}

/** "1 of 3 used", the line both dashboards show next to the Extend button. */
export function extensionUsageText(used: number): string {
  return `${used} of ${MAX_WARRANTY_EXTENSIONS} used`;
}

/**
 * The months the record really covers now: the original promise plus every
 * extension. Without this a screen shows "12 months" beside a date that is 18
 * months away.
 */
export function totalCoverageMonths(
  months?: number | null,
  extensions?: { months: number }[] | null
): number {
  const extra = (extensions || []).reduce(
    (sum, entry) => sum + (Number(entry?.months) || 0),
    0
  );
  return (Number(months) || 0) + extra;
}

/**
 * Why a closed warranty is closed, in one sentence for the customer.
 * "Expired" covers three different stories, and the customer deserves to know
 * which one happened instead of guessing.
 */
export function closedReasonText(warranty: {
  status?: string;
  closedReason?: string;
  expiryDate?: string | Date;
}): string {
  if (warranty.status !== "expired") return "";

  switch (warranty.closedReason) {
    case "rejected":
      return "The store rejected the claim, so this warranty is closed.";
    case "void":
      return "The order was cancelled or returned, so this warranty is closed.";
    case "date":
      return "The warranty period finished, so this warranty is closed.";
    default:
      // Records written before the reason was stored have no closedReason.
      return "This warranty is closed.";
  }
}
