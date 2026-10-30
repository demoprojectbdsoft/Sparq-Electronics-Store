"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CreditCard,
  Mail,
  CircleX,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  UserX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getActivities } from "@/lib/action/activity";
import { formatOrderDateTime } from "@/lib/dateTime";
import type { AdminActivity, AdminActivityType } from "@/types";

/**
 * The ids of the lines the admin has already read.
 *
 * One id per line, because every line carries its own dot: reading one leaves
 * the rest untouched. The list is ordered newest first and cut to a limit, so a
 * long-running browser cannot grow it forever.
 */
const SEEN_IDS_KEY = "sparq:activities:seen-ids";
/** Keys written by earlier versions of the bell; removed so they cannot linger. */
const LEGACY_KEYS = ["sparq:activities:seen", "sparq:activities:seen-at"];
/** How many read ids are remembered; the panel itself only shows the newest few. */
const SEEN_IDS_LIMIT = 300;
/** How often the bell asks for new lines while the dashboard is open. */
const POLL_MS = 60_000;
/** How often the "3m ago" labels are recomputed, so they never freeze. */
const TICK_MS = 30_000;

/** One icon per kind of activity, so a glance tells the admin what happened. */
const ICONS: Record<AdminActivityType, LucideIcon> = {
  order: ShoppingBag,
  transaction: CreditCard,
  user: UserPlus,
  user_deleted: UserX,
  order_cancelled: CircleX,
  warranty: ShieldCheck,
  message: Mail,
};

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
 * Where one activity sends the admin.
 *
 * The API only stores the value to look for, never a route, so a line saved
 * months ago still opens the right page after the dashboard changes.
 */
function linkFor(activity: AdminActivity): string {
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
    default:
      return "/dashboard/admin";
  }
}

/** "just now", "12m ago", "3h ago", "2d ago" — measured on the API clock. */
function timeAgo(value: string, nowMs: number): string {
  const then = timeOf(value);
  if (!then) return "";

  // Never negative: a stamp a second ahead of the clock still reads "now".
  const minutes = Math.floor(Math.max(0, nowMs - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * The admin notification bell: a red dot while any line is unread, and a panel
 * of the last few lines that each open the matching screen.
 *
 * Every line has its own dot. Clicking it reads that one line; "Mark all as
 * read" clears the rest. The bell's dot disappears only once nothing is left
 * unseen, and the mark is shared between tabs.
 *
 * Only admins and the demo admin see it; the customer dashboard has no bell at
 * all, because this feed names other people's orders and accounts.
 */
export default function NotificationBell() {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // The ids already read, which decide every dot in sight.
  const [seenIds, setSeenIds] = useState<string[]>([]);
  // How far this device's clock is ahead of the API clock. Every "3m ago"
  // below is computed against the API clock, via this offset.
  const [clockOffset, setClockOffset] = useState(0);
  // Ticks the labels, so a line shown as "just now" ages without a reload.
  const [now, setNow] = useState(() => Date.now());
  const wrapRef = useRef<HTMLDivElement>(null);

  /** Reads the given lines: their dots go, the others keep theirs. */
  const markSeen = useCallback((ids: string[]) => {
    if (!ids.length) return;

    setSeenIds((current) => {
      const merged = Array.from(new Set([...ids, ...current])).slice(0, SEEN_IDS_LIMIT);
      localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const load = useCallback(async () => {
    const feed = await getActivities();

    // A failed read is not an empty feed: keep the lines already on screen.
    if (!feed.ok) return;

    // The API hands over its own clock with the lines. Remember the gap once,
    // so a device with a wrong system time still shows the real "3m ago".
    const serverMs = timeOf(feed.serverTime);
    if (serverMs) setClockOffset(Date.now() - serverMs);

    setActivities(feed.activities);
    // Another tab may have read some of these lines already.
    setSeenIds(readSeenIds());
  }, []);

  // The bell lives in the dashboard navbar, so it refreshes itself instead of
  // asking every page to hand it a list. The first read goes through a timer
  // like the later ones, so nothing is set while the effect body is running.
  useEffect(() => {
    const firstLoad = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), POLL_MS);

    // Coming back to the tab is the moment the admin expects fresh lines.
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
  // for as long as the admin leaves the dashboard open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // Reading in one tab has to clear the dots in the other ones too.
  useEffect(() => {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));

    const onStorage = (event: StorageEvent) => {
      if (event.key === SEEN_IDS_KEY) setSeenIds(readSeenIds());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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

  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);
  const unreadCount = activities.filter((activity) => !seenSet.has(activity._id)).length;
  const hasUnread = unreadCount > 0;
  // Labels are measured on the API clock, not on this device's clock.
  const nowMs = now - clockOffset;

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    // Opening reads nothing by itself: each line has its own dot to clear.
    if (next) {
      setNow(Date.now());
      void load();
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={
          hasUnread
            ? `Notifications, ${unreadCount} unread`
            : "Notifications, nothing unread"
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
          aria-label="Recent activity"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elevated)] shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-color)]">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--foreground)]">Recent activity</p>
              <p className="text-[10px] font-semibold text-[var(--foreground-muted)]">
                {activities.length === 0
                  ? "Nothing yet"
                  : hasUnread
                    ? `${unreadCount} unread of ${activities.length}`
                    : "All read"}
              </p>
            </div>

            {hasUnread && (
              <button
                type="button"
                onClick={() => markSeen(activities.map((activity) => activity._id))}
                className="shrink-0 text-[10px] font-bold text-[var(--brand-flat)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-flat)]/35 rounded px-1 py-0.5 cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {activities.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-[var(--foreground-muted)]">
              Orders, payments, new users, warranties and messages show up here.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-[var(--border-color)]/60">
              {activities.map((activity) => {
                const Icon = ICONS[activity.type] || Bell;
                // Each line stands alone: only its own click clears its dot.
                const isUnread = !seenSet.has(activity._id);

                return (
                  <li key={activity._id}>
                    <Link
                      href={linkFor(activity)}
                      role="menuitem"
                      onClick={() => {
                        markSeen([activity._id]);
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
                          {activity.title}
                        </span>
                        {activity.detail && (
                          <span className="block text-[11px] text-[var(--foreground-muted)] truncate">
                            {activity.detail}
                          </span>
                        )}
                        <span
                          className="block text-[10px] text-[var(--foreground-muted)] mt-0.5"
                          title={formatOrderDateTime(activity.createdAt)}
                        >
                          {timeAgo(activity.createdAt, nowMs)}
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
              href="/dashboard/admin"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-[var(--brand-flat)] hover:underline"
            >
              Go to the dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
