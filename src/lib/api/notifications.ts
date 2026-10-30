import { serverFetch } from "../core/server";
import { withQuery } from "../core/query";

/**
 * Read-only notification API helpers for a customer or a rider.
 *
 * Notifications live in the same `activities` collection as the store feed, so
 * they are read from `/activities/mine`. Mutations live in
 * `@/lib/action/notifications`.
 */

export const getMyNotifications = async (params?: {
  page?: number;
  limit?: number;
  unread?: "true" | "false";
}) => {
  return serverFetch(withQuery("/activities/mine", params), true);
};

export const getMyUnreadCount = async () => {
  return serverFetch("/activities/mine/unread-count", true);
};
