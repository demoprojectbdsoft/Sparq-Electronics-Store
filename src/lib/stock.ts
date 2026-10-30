// Stock is optional. When an admin leaves the stock field blank the product is
// not stock-tracked: nothing can ever run it dry, so it is always offered and no
// "out of stock" label or quantity limit may appear. Only a real number turns
// the stock rules on.

/** True when the product actually keeps a stock count. */
export function isStockTracked(stockQuantity?: number | null): boolean {
  return typeof stockQuantity === "number" && Number.isFinite(stockQuantity);
}

/**
 * True only for a tracked product that has run out.
 * A product with no stock number is never sold out, whatever its stored flag says.
 */
export function isProductOutOfStock(product: {
  inStock?: boolean;
  stockQuantity?: number | null;
}): boolean {
  if (!isStockTracked(product.stockQuantity)) return false;
  return product.inStock === false || (product.stockQuantity as number) <= 0;
}

/** Units left to sell, or null when the product is not tracked. */
export function unitsLeft(stockQuantity?: number | null): number | null {
  if (!isStockTracked(stockQuantity)) return null;
  return Math.max(0, stockQuantity as number);
}
