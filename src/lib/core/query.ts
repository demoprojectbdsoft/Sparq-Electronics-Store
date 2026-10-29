/** Values accepted by the query helpers. */
export type QueryValue = string | number | boolean | null | undefined;

/**
 * Turns a plain object into a query string, skipping empty values so callers
 * never send `?page=&limit=`.
 *
 * Returns "" when nothing is left, so the result can be appended directly.
 * Example: `"/products" + toQueryString({ page: 1 })` → `"/products?page=1"`.
 */
export function toQueryString(params?: Record<string, QueryValue>): string {
  if (!params) return "";

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/** Appends the query string for `params` to a path. */
export function withQuery(path: string, params?: Record<string, QueryValue>): string {
  return path + toQueryString(params);
}
