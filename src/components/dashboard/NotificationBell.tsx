"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CircleX,
  CreditCard,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Star,
  UserPlus,
  UserX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getActivities } from "@/lib/action/activity";
import {
  loadMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/action/notifications";
import { formatOrderDateTime, formatTimeAgo } from "@/lib/dateTime";
import {
  PERSONAL_NOTIFICATION_EMPTY,
  PERSONAL_NOTIFICATION_FALLBACK_ICON,
  PERSONAL_NOTIFICATION_ICONS,
  personalNotificationLink,
} from "@/lib/notifications";
import type { AdminActivity, AdminActivityType } from "@/types";

/** How often the bell asks for new lines while the dashboard is open. */
const POLL_MS = 60_000;
/** How many lines the panel shows; the full personal feed has its own page. */
const PANEL_LIMIT = 8;

/**
 * The ids of the store lines this browser has already read.
 *
 * One id per line, because every line carries its own dot: reading one leaves
 * the rest untouched. The store feed is shared by every admin, so its read
 * state stays on the device rather than becoming somebody else's "read".
 */
const SEEN_IDS_KEY = "sparq:activities:seen-ids";
/** Keys written by earlier versions of the bell; removed so they cannot linger. */
const LEGACY_KEYS = ["sparq:activities:seen", "sparq:activities:seen-at"];
/** How many read ids are remembered; the panel itself only shows the newest few. */
const SEEN_IDS_LIMIT = 300;

/** One icon per kind of store activity, so a glance tells the story. */
const STORE_ICONS: Record<AdminActivityType, LucideIcon> = {
  order: ShoppingBag,
  transaction: CreditCard,
  user: UserPlus,
  user_deleted: UserX,
  order_cancelled: CircleX,
  warranty: ShieldCheck,
  message: Mail,
  review: Star,
};

/** One line, whichever feed it came from: the panel renders this shape only. */
interface BellItem {
  id: string;
  title: string;
  detail?: string;
  createdAt: string;
  href: string;
  icon: LucideIcon;
  unread: boolean;
}

/** Milliseconds of a stored timestamp, or 0 when it is missing or unreadable. */
function timeOf(value: string | undefined): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** The ids saved by previous visits, or an empty list when the value is junk. */
function readSeenIds(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Where one store line sends the admin.
 *
 * The API only stores the value to look for, never a route, so a line saved
 * months ago still opens the right page after the dashboard changes.
 */
function storeLinkFor(activity: AdminActivity): string {
  const ref = encodeURIComponent(activity.ref || "");

  switch (activity.type) {
    case "order":
    case "order_cancelled":
      // The orders list searches ids, so the full order id finds exactly one.
      return `/dashboard/admin/orders${ref ? `?search=${ref}` : ""}`;
    case "transaction":
      return `/dashboard/admin/transactions${ref ? `?search=${ref}` : ""}`;
    case "user":
      return `/dashboard/admin/users${ref ? `?search=${ref}` : ""}`;
    case "user_deleted":
      // The account is gone, so there is nothing left to search for.
      return "/dashboard/admin/users";
    case "warranty":
      // "all" because new coverage is not claimed yet, and the claims view that
      // the page opens on would hide exactly the record this line is about.
      return `/dashboard/admin/warranties?status=all${ref ? `&orderId=${ref}` : ""}`;
    case "message":
      return `/dashboard/admin/messages${ref ? `?search=${ref}` : ""}`;
    case "review":
      // The reviews list searches by id too, so one line opens one review.
      return `/dashboard/admin/reviews${ref ? `?search=${ref}` : ""}`;
    default:
      return "/dashboard/admin";
  }
}

export interface NotificationBellProps {
  /**
   * Which feed the bell reads.
   *
   * "store" is the shared activity feed every admin sees; "personal" is the
   * lines addressed to one customer or rider.
   */
  scope?: "store" | "personal";
  /** Needed by the personal scope to build links and copy. */
  role?: "customer" | "rider";
}

/**
 * The dashboard notification bell, for every role.
 *
 * The panel, the dots, the polling and the relative labels are the same
 * everywhere; only the feed behind them changes. A store line's read state is
 * kept on the device (the feed is shared), while a personal line's read state
 * is the server's, so it clears on every device the account is signed in on.
 */
export default function NotificationBell({ scope = "store", role = "customer" }: NotificationBellProps) {
  const isStore = scope === "store";

  const [items, setItems] = useState<BellItem[]>([]);
  // A personal feed shows one page of lines, so its unread total comes from the
  // API. The store feed is a fixed head of the list, so its total is derived.
  const [personalUnread, setPersonalUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  // How far this device's clock is ahead of the API clock. Every "3m ago"
  // below is computed against the API clock, via this offset.
  const [clockOffset, setClockOffset] = useState(0);
  // Ticks the labels, so a line shown as "just now" ages without a reload.
  const [now, setNow] = useState(() => Date.now());
  const wrapRef = useRef<HTMLDivElement>(null);

  const unreadCount = isStore ? items.filter((line) => line.unread).length : personalUnread;

  /** Reads the given store lines: their dots go, the others keep theirs. */
  const markSeen = useCallback((ids: string[]) => {
    if (!ids.length) return;

    const current = readSeenIds();
    const merged = Array.from(new Set([...ids, ...current])).slice(0, SEEN_IDS_LIMIT);
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(merged));

    const seenSet = new Set(merged);
    setItems((lines) =>
      lines.map((line) => (seenSet.has(line.id) ? { ...line, unread: false } : line))
    );
  }, []);

  /** The store feed: the newest lines, plus the API clock that stamped them. */
  const loadStore = useCallback(async () => {
    const feed = await getActivities(PANEL_LIMIT);

    // A failed read is not an empty feed: keep the lines already on screen.
    if (!feed.ok) return;

    // Another tab may have read some of these lines already.
    const seenSet = new Set(readSeenIds());
    setItems(
      feed.activities.map((activity) => ({
        id: activity._id,
        title: activity.title,
        detail: activity.detail,
        createdAt: activity.createdAt,
        href: storeLinkFor(activity),
        icon: STORE_ICONS[activity.type] || Bell,
        unread: !seenSet.has(activity._id),
      }))
    );
    return feed.serverTime;
  }, []);

  /** The personal feed: only the caller's own lines, newest first. */
  const loadPersonal = useCallback(async () => {
    const feed = await loadMyNotifications(PANEL_LIMIT);

    // A failed read is not an empty feed: keep the lines already on screen.
    if (!feed.ok) return;

    setItems(
      feed.notifications.map((line) => ({
        id: line._id,
        title: line.title,
        detail: line.detail,
        createdAt: line.createdAt,
        href: personalNotificationLink(line, role),
        icon: PERSONAL_NOTIFICATION_ICONS[line.type] || PERSONAL_NOTIFICATION_FALLBACK_ICON,
        unread: !line.readAt,
      }))
    );
    setPersonalUnread(feed.unreadCount);
    return feed.serverTime;
  }, [role]);

  const load = useCallback(async () => {
    const serverTime = await (isStore ? loadStore() : loadPersonal());

    // The API hands over its own clock with the lines. Remember the gap once,
    // so a device with a wrong system time still shows the real "3m ago".
    const serverMs = timeOf(serverTime);
    if (serverMs) setClockOffset(Date.now() - serverMs);
  }, [isStore, loadStore, loadPersonal]);

  // The bell lives in the dashboard navbar, so it refreshes itself instead of
  // asking every page to hand it a list. The first read goes through a timer
  // like the later ones, so nothing is set while the effect body is running.
  useEffect(() => {
    const firstLoad = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), POLL_MS);

    // Coming back to the tab is the moment the reader expects fresh lines.
    const onFocus = () => void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(firstLoad);
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // The relative labels age on their own; without this a line stays "just now"
  // for as long as the dashboard is left open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // The store's read state is per device, so it has to be shared between tabs.
  useEffect(() => {
    if (!isStore) return;

    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SEEN_IDS_KEY) return;
      const seenSet = new Set(readSeenIds());
      setItems((lines) => lines.map((line) => ({ ...line, unread: !seenSet.has(line.id) })));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [isStore]);

  // A menu should close the way every other menu on the site closes.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const hasUnread = unreadCount > 0;
  // Labels are measured on the API clock, not on this device's clock.
  const nowMs = now - clockOffset;

  /** Clears one dot here and, for a personal line, on the server too. */
  const readOne = (item: BellItem) => {
    if (isStore) {
      markSeen([item.id]);
      return;
    }

    setItems((lines) =>
      lines.map((line) => (line.id === item.id ? { ...line, unread: false } : line))
    );
    setPersonalUnread((count) => Math.max(0, count - 1));
    void markNotificationRead(item.id).catch(() => void load());
  };

  const readAll = () => {
    if (isStore) {
      markSeen(items.filter((line) => line.unread).map((line) => line.id));
      return;
    }

    setItems((lines) => lines.map((line) => ({ ...line, unread: false })));
    setPersonalUnread(0);
    void markAllNotificationsRead().catch(() => void load());
  };

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    // Opening reads nothing by itself: each line has its own dot to clear.
    if (next) {
      setNow(Date.now());
      void load();
    }
  };

  // Only the words change between the two feeds; the panel below is one panel.
  const copy = isStore
    ? {
        title: "Recent activity",
        emptyText: "Orders, payments, new users, warranties and messages show up here.",
        footerHref: "/dashboard/admin",
        footerLabel: "Go to the dashboard",
      }
    : {
        title: "Notifications",
        emptyText: PERSONAL_NOTIFICATION_EMPTY[role],
        footerHref: `/dashboard/${role}/notifications`,
        footerLabel: "See all notifications",
      };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={
          hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications, nothing unread"
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="w-9 h-9 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--foreground-muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--foreground)] hover:border-[var(--brand-flat)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-flat)]/35 transition-all relative shadow-2xs cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[var(--surface-elevated)]" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={copy.title}
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elevated)] shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-color)]">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--foreground)]">{copy.title}</p>
              <p className="text-[10px] font-semibold text-[var(--foreground-muted)]">
                {items.length === 0
                  ? "Nothing yet"
                  : hasUnread
                    ? `${unreadCount} unread of ${items.length}`
                    : "All read"}
              </p>
            </div>

            {hasUnread && (
              <button
                type="button"
                onClick={readAll}
                className="shrink-0 text-[10px] font-bold text-[var(--brand-flat)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-flat)]/35 rounded px-1 py-0.5 cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-[var(--foreground-muted)]">
              {copy.emptyText}
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-[var(--border-color)]/60">
              {items.map((item) => {
                const Icon = item.icon;
                // Each line stands alone: only its own click clears its dot.
                const isUnread = item.unread;

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      role="menuitem"
                      onClick={() => {
                        if (isUnread) readOne(item);
                        setIsOpen(false);
                      }}
                      className="flex gap-3 px-4 py-3 hover:bg-[var(--surface-alt)] transition-colors"
                    >
                      <span className="mt-0.5 w-7 h-7 shrink-0 rounded-lg border border-[var(--border-color)] bg-[var(--surface-alt)] flex items-center justify-center text-[var(--brand-flat)]">
                        <Icon className="w-3.5 h-3.5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-xs leading-snug truncate ${
                            isUnread ? "font-bold" : "font-semibold"
                          } text-[var(--foreground)]`}
                        >
                          {item.title}
                        </span>
                        {item.detail && (
                          <span className="block text-[11px] text-[var(--foreground-muted)] truncate">
                            {item.detail}
                          </span>
                        )}
                        <span
                          className="block text-[10px] text-[var(--foreground-muted)] mt-0.5"
                          title={formatOrderDateTime(item.createdAt)}
                        >
                          {formatTimeAgo(item.createdAt, nowMs)}
                        </span>
                      </span>

                      {isUnread && (
                        <span
                          aria-hidden="true"
                          className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-red-500"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="px-4 py-2.5 border-t border-[var(--border-color)] bg-[var(--surface-alt)]/40">
            <Link
              href={copy.footerHref}
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-[var(--brand-flat)] hover:underline"
            >
              {copy.footerLabel}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
