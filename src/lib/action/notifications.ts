"use server";

import { serverMutation } from "../core/server";
import { getMyNotifications } from "../api/notifications";
import type { PersonalNotificationFeed } from "@/types";

/**
 * The customer's or rider's own feed, for the header bell.
 *
 * Reads go through `lib/api`, writes through `serverMutation`: the token always
 * comes from the session, so the caller can only ever touch their own lines.
 */
export const loadMyNotifications = async (limit: number = 6): Promise<PersonalNotificationFeed> => {
  const res = await getMyNotifications({ limit });
  const list = res?.data?.notifications;

  return {
    // A failed request is not an empty feed: the bell must keep what it has.
    ok: Array.isArray(list),
    notifications: Array.isArray(list) ? list : [],
    unreadCount: Number(res?.data?.unreadCount) || 0,
    serverTime: res?.data?.serverTime || new Date().toISOString(),
  };
};

export const markNotificationRead = async (id: string) => {
  return serverMutation(`/activities/mine/${encodeURIComponent(id)}/read`, "", "PATCH");
};

export const markAllNotificationsRead = async () => {
  return serverMutation("/activities/mine/read-all", "", "PATCH");
};
