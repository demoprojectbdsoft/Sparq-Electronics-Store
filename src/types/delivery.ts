/**
 * The delivery domain as the app reads it.
 *
 * The backend mirrors these names in `delivery.model.ts`; the rider screens
 * only ever see their own rows, and every id is a string by the time it
 * reaches the browser.
 */

export const DELIVERY_STATUSES = [
  "assigned",
  "accepted",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "declined",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/** The status shortcuts the API understands, on top of one exact stage. */
export type DeliveryStatusFilter = "all" | "active" | "finished" | DeliveryStatus;

export interface DeliveryRecord {
  _id: string;
  orderId: string;
  /** "#ORD-A1B2C3" — the short form the dashboards show. */
  orderNumber: string;
  status: DeliveryStatus;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  items: number;
  orderTotal: number;
  /** What the rider is paid for this job. */
  fee: number;
  distanceKm: number | null;
  declineReason: string;
  expiresAt: string | null;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One point in the rider's daily chart. Every day in the range is present. */
export interface RiderSeriesPoint {
  /** Local date key, "2026-10-31". */
  date: string;
  delivered: number;
  cancelled: number;
  earnings: number;
}

export interface RiderStats {
  totalDeliveries: number;
  completed: number;
  active: number;
  pendingRequests: number;
  cancelled: number;
  /** All-time fee total for delivered jobs. */
  earnings: number;
  earningsThisMonth: number;
  /** Fee total for the charted range only. */
  earningsInWindow: number;
  /** Percent of finished jobs that were delivered. */
  successRate: number;
  /** Average minutes from accept to delivered. */
  avgDeliveryMinutes: number;
}

export type DeliveryStatusCounts = Record<DeliveryStatus, number>;

export interface RiderStatsResult {
  stats: RiderStats;
  statusCounts: DeliveryStatusCounts;
  series: RiderSeriesPoint[];
  recent: DeliveryRecord[];
  range: { days: number; from: string; to: string };
}

export interface DeliveryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DeliveryFeed {
  deliveries: DeliveryRecord[];
  total: number;
  pagination: DeliveryPagination;
}

/** Which icon a stat card draws; resolved by the client component. */
export type RiderStatIcon =
  | "PackageCheck"
  | "CheckCircle2"
  | "Navigation"
  | "Inbox"
  | "XCircle"
  | "Wallet"
  | "CalendarDays"
  | "Timer";

export interface RiderStatCardData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconName: RiderStatIcon;
}
