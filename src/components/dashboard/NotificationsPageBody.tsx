import { Bell } from "lucide-react";
import { getMyNotifications } from "@/lib/api/notifications";
import { PERSONAL_NOTIFICATION_EMPTY } from "@/lib/notifications";
import NotificationFeed from "./NotificationFeed";
import MarkAllNotificationsButton from "./MarkAllNotificationsButton";
import type { PersonalNotification } from "@/types";

const COPY = {
  customer: {
    title: "Notifications",
    description: "Order confirmations, shipping updates and delivery news.",
  },
  rider: {
    title: "Notifications",
    description: "New delivery requests and updates about the deliveries you own.",
  },
} as const;

/**
 * The body of both notification pages.
 *
 * The feed is read on the server with the session token, so the API decides
 * whose lines these are; this component never names a user id.
 */
export default async function NotificationsPageBody({ role }: { role: "customer" | "rider" }) {
  const res = await getMyNotifications({ limit: 50 });
  const raw = res?.data?.notifications;
  const items: PersonalNotification[] = Array.isArray(raw) ? raw : [];
  const unread = Number(res?.data?.unreadCount) || 0;
  // Every label is measured on the API clock that stamped the lines, never on
  // the clock of whichever server happened to render this page.
  const serverTime = res?.data?.serverTime;
  const nowMs = serverTime ? new Date(serverTime).getTime() : 0;
  const copy = COPY[role];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-[var(--foreground)]">{copy.title}</h1>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            {copy.description}{" "}
            {items.length > 0 && (
              <span className="font-semibold">
                {unread > 0 ? `${unread} unread` : "All caught up"}
              </span>
            )}
          </p>
        </div>

        <MarkAllNotificationsButton disabled={unread === 0} />
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-alt)]/40 px-6 py-14 text-center">
          <span className="mx-auto w-12 h-12 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--foreground-muted)]">
            <Bell className="w-5 h-5" />
          </span>
          <p className="mt-3 text-sm font-bold text-[var(--foreground)]">Nothing yet</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            {PERSONAL_NOTIFICATION_EMPTY[role]}
          </p>
        </div>
      ) : (
        <NotificationFeed items={items} role={role} nowMs={nowMs} />
      )}
    </div>
  );
}
