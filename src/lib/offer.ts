// A deal countdown only makes sense while the selling price is really lower than
// the original price. When the seller leaves both prices the same there is
// nothing running out, so every screen hides the timer instead of advertising an
// offer that does not exist.

/** Turns a form value or API value into a number, or null when it is empty. */
function toAmount(value?: number | string | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

/**
 * True only when the original price is higher than the selling price.
 * Both values may be numbers or numeric strings, because the forms keep their
 * price fields as text.
 */
export function hasOfferDiscount(
  price?: number | string | null,
  originalPrice?: number | string | null
): boolean {
  const selling = toAmount(price);
  const original = toAmount(originalPrice);
  if (selling === null || original === null) return false;
  return original > selling;
}
