"use server";

import { serverFetch } from "../core/server";
import type { AdminActivityFeed } from "@/types";

/**
 * The newest lines of the admin activity feed, for the notification bell.
 *
 * Returns an empty feed when the caller is not a store admin, so the bell just
 * shows nothing instead of breaking the dashboard header.
 */
export const getActivities = async (limit: number = 8): Promise<AdminActivityFeed> => {
  const res = await serverFetch(`/activities?limit=${limit}`, true);
  const list = res?.data?.activities;
  return {
    // A failed request is not an empty feed: the bell must keep what it has.
    ok: Array.isArray(list),
    activities: Array.isArray(list) ? list : [],
    serverTime: res?.data?.serverTime || new Date().toISOString(),
  };
};
