// The brand is not a column of its own — it lives inside the free-form
// specifications as a "Brand" row. These helpers read it the same way the server
// does, so the forms can refuse a manufacturer warranty without a brand before
// the request is even sent.

/** Reads one specification value, whatever the admin capitalised the key as. */
export function specValue(
  specifications: Record<string, unknown> | undefined | null,
  name: string
): string {
  if (!specifications || typeof specifications !== "object") return "";
  const key = Object.keys(specifications).find(
    (candidate) => candidate.trim().toLowerCase() === name.toLowerCase()
  );
  return key ? String(specifications[key] ?? "").trim() : "";
}

/** True when the specifications carry a brand. */
export function hasBrandSpec(
  specifications: Record<string, unknown> | undefined | null
): boolean {
  return specValue(specifications, "brand") !== "";
}
