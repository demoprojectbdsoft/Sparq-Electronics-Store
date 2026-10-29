/**
 * One colour palette for every order status badge in the app.
 *
 * Each entry pairs a soft background with a strong text colour of the *same*
 * hue, so the label always stays readable in light and dark mode. Keeping the
 * pairs here stops the old mistake of printing brand-blue text on the amber
 * accent colour, which made the "Shipped" badge almost invisible.
 */

import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Clock,
  Package,
  PackageSearch,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";

export interface OrderStatusStyle {
  /** How the status is spelled on screen, whatever casing the API used. */
  label: string;
  /** Pill classes: background, text colour and border. */
  badge: string;
  /** Colour for a small icon or label sitting next to the pill. */
  accent: string;
  /** Solid colour for a status dot. */
  dot: string;
  /** Icon shown inside the pill. */
  icon: LucideIcon;
}

const ORDER_STATUS_STYLES: Record<string, OrderStatusStyle> = {
  confirmed: {
    label: "Confirmed",
    badge:
      "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-500/30",
    accent: "text-indigo-600 dark:text-indigo-300",
    dot: "bg-indigo-500 dark:bg-indigo-400",
    icon: Package,
  },
  pending: {
    label: "Pending",
    badge:
      "bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30",
    accent: "text-slate-600 dark:text-slate-300",
    dot: "bg-slate-400 dark:bg-slate-300",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    badge:
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30",
    accent: "text-amber-600 dark:text-amber-300",
    dot: "bg-amber-500 dark:bg-amber-400",
    icon: PackageSearch,
  },
  shipped: {
    label: "Shipped",
    badge:
      "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/30",
    accent: "text-violet-600 dark:text-violet-300",
    dot: "bg-violet-500 dark:bg-violet-400",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    badge:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30",
    accent: "text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    badge:
      "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-500/30",
    accent: "text-rose-600 dark:text-rose-300",
    dot: "bg-rose-500 dark:bg-rose-400",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    badge:
      "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/30",
    accent: "text-sky-600 dark:text-sky-300",
    dot: "bg-sky-500 dark:bg-sky-400",
    icon: RotateCcw,
  },
};

/** Old label spellings used by the dashboards, mapped to the real status. */
const ALIASES: Record<string, string> = {
  completed: "delivered",
};

function normalize(status?: string | null): string {
  const raw = (status || "").trim().toLowerCase();
  return ALIASES[raw] ?? raw;
}

/** Missing or unknown statuses fall back to the neutral "processing" look. */
export function getOrderStatusStyle(status?: string | null): OrderStatusStyle {
  return ORDER_STATUS_STYLES[normalize(status)] ?? ORDER_STATUS_STYLES.processing;
}

/** Same status, but spelled the way we want it shown on screen. */
export function getOrderStatusLabel(status?: string | null): string {
  return getOrderStatusStyle(status).label;
}
