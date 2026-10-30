import type {
  DeliveryRecord,
  DeliveryStatus,
  RiderStatCardData,
  RiderStats,
} from "@/types/delivery";

/**
 * The rider screens' shared vocabulary.
 *
 * Every label, chip colour and stat card lives here, so the overview, the
 * lists and the exports describe a delivery the same way.
 */

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  assigned: "Awaiting you",
  accepted: "Accepted",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  declined: "Declined",
};

/** Chip colours: calm for a new job, brand for work in progress, green at the door. */
export const DELIVERY_STATUS_STYLES: Record<DeliveryStatus, string> = {
  assigned: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  accepted: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
  picked_up: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
  out_for_delivery: "bg-[var(--brand-flat)]/10 text-[var(--brand-flat)] border-[var(--brand-flat)]/25",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
  declined: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
};

/** Statuses that mean the rider is working on the job right now. */
export const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = [
  "accepted",
  "picked_up",
  "out_for_delivery",
];

export function isActiveDelivery(status: DeliveryStatus): boolean {
  return ACTIVE_DELIVERY_STATUSES.includes(status);
}

/**
 * A request that nobody answered in time. The rider can still see it in the
 * inbox, but it is no longer a job the store is waiting on.
 */
export function isDeliveryExpired(delivery: DeliveryRecord, nowMs: number): boolean {
  if (delivery.status !== "assigned" || !delivery.expiresAt) return false;
  return new Date(delivery.expiresAt).getTime() < nowMs;
}

/** The ids of every request in the list whose answer window has closed. */
export function expiredDeliveryIds(deliveries: DeliveryRecord[]): string[] {
  const nowMs = Date.now();
  return deliveries
    .filter((delivery) => isDeliveryExpired(delivery, nowMs))
    .map((delivery) => delivery._id);
}

/** 42 -> "42 min", 95 -> "1h 35m", 0 -> "—" (never measured yet). */
export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

/** "3.4 km" — or an empty string when the store has not measured it. */
export function formatDistance(km: number | null): string {
  if (km === null || km === undefined || !Number.isFinite(km)) return "";
  return `${km.toFixed(1)} km`;
}

/** "2026-10-31" -> "Oct 31", read as a local date so the day never shifts. */
export function formatDayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  if (isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Oct 31, 02:15 PM" — the rider's clock, not a UTC one. */
export function formatMoment(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The eight overview cards, in the order the brief lists them: the work first,
 * then the money, then the clock.
 */
export function riderStatCards(
  stats: RiderStats,
  money: (value: number) => string
): RiderStatCardData[] {
  return [
    {
      title: "Total Deliveries",
      value: String(stats.totalDeliveries),
      change: `${stats.completed} delivered`,
      isPositive: true,
      iconName: "PackageCheck",
    },
    {
      title: "Completed",
      value: String(stats.completed),
      change: `${stats.successRate}% success rate`,
      isPositive: stats.successRate >= 50,
      iconName: "CheckCircle2",
    },
    {
      title: "Active Now",
      value: String(stats.active),
      change: stats.active > 0 ? "Jobs on the road" : "Nothing in hand",
      isPositive: true,
      iconName: "Navigation",
    },
    {
      title: "Pending Requests",
      value: String(stats.pendingRequests),
      change: stats.pendingRequests > 0 ? "Waiting for your answer" : "Inbox is clear",
      isPositive: stats.pendingRequests === 0,
      iconName: "Inbox",
    },
    {
      title: "Cancelled",
      value: String(stats.cancelled),
      change: stats.cancelled > 0 ? "Stopped before delivery" : "None cancelled",
      isPositive: stats.cancelled === 0,
      iconName: "XCircle",
    },
    {
      title: "Total Earnings",
      value: money(stats.earnings),
      change: "Delivered jobs only",
      isPositive: true,
      iconName: "Wallet",
    },
    {
      title: "This Month",
      value: money(stats.earningsThisMonth),
      change: "Since the 1st",
      isPositive: true,
      iconName: "CalendarDays",
    },
    {
      title: "Avg Delivery Time",
      value: formatMinutes(stats.avgDeliveryMinutes),
      change: "Accept to doorstep",
      isPositive: true,
      iconName: "Timer",
    },
  ];
}
