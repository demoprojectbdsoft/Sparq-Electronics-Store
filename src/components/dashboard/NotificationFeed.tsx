import Link from "next/link";
import { formatOrderDateTime, formatTimeAgo } from "@/lib/dateTime";
import {
  PERSONAL_NOTIFICATION_FALLBACK_ICON,
  PERSONAL_NOTIFICATION_ICONS,
  personalNotificationLink,
} from "@/lib/notifications";
import type { PersonalNotification } from "@/types";

interface NotificationFeedProps {
  items: PersonalNotification[];
  role: "customer" | "rider";
  /** The API clock, so "3m ago" does not depend on this device's time. */
  nowMs?: number;
}

/**
 * The full notification list on the customer's and rider's own page.
 *
 * Every card opens the screen the line is about, and an unread line stays
 * bold with its dot until it is opened.
 */
export default function NotificationFeed({ items, role, nowMs }: NotificationFeedProps) {
  return (
    <ul className="space-y-2.5">
      {items.map((line) => {
        const Icon = PERSONAL_NOTIFICATION_ICONS[line.type] || PERSONAL_NOTIFICATION_FALLBACK_ICON;
        const isUnread = !line.readAt;

        return (
          <li key={line._id}>
            <Link
              href={personalNotificationLink(line, role)}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                isUnread
                  ? "border-[var(--brand-flat)]/35 bg-[var(--brand-flat)]/[0.04] hover:bg-[var(--brand-flat)]/[0.08]"
                  : "border-[var(--border-color)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-alt)]"
              }`}
            >
              <span className="w-9 h-9 shrink-0 rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)] flex items-center justify-center text-[var(--brand-flat)]">
                <Icon className="w-4 h-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      isUnread ? "font-bold" : "font-semibold"
                    } text-[var(--foreground)]`}
                  >
                    {line.title}
                  </span>
                  {isUnread && (
                    <span
                      aria-label="Unread"
                      className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500"
                    />
                  )}
                </span>

                {line.detail && (
                  <span className="mt-0.5 block text-xs text-[var(--foreground-muted)]">
                    {line.detail}
                  </span>
                )}

                <span
                  className="mt-1 block text-[11px] font-semibold text-[var(--foreground-muted)]"
                  title={formatOrderDateTime(line.createdAt)}
                >
                  {formatTimeAgo(line.createdAt, nowMs)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
