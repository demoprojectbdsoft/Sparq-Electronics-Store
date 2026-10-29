import { serverFetch } from "../core/server";

/**
 * Read-only warranty API helpers. Mutations live in `@/lib/action/warranty`.
 */

export const getWarranties = async (
  params?: Record<string, string | number | boolean | undefined>
) => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });
  }
  return serverFetch(`/warranties?${query.toString()}`, true);
};

export const getMyWarranties = async () => {
  return serverFetch(`/warranties/mine`, true);
};

/**
 * Fetch the warranty record for a single order item.
 * Returns null when no warranty exists for this (user, order, product) triple.
 */
export const getWarrantyForOrderItem = async (orderId: string, productId: string) => {
  return serverFetch(`/warranties/order/${orderId}/product/${productId}`, true);
};