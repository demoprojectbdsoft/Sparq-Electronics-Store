/**
 * One colour palette for every warranty status badge.
 *
 * Same idea as lib/orderStatusStyles.ts: each entry pairs a soft background
 * with a strong text colour of the same hue, so a badge stays readable in
 * light and dark mode. The table and the details modal both read from here,
 * so a status can never show two different colours.
 */

import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MessageCircleQuestion,
  Shield,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

export interface WarrantyStatusStyle {
  /** How the status is spelled on screen. */
  label: string;
  /** Pill classes: background, text colour and border. */
  badge: string;
  /** Solid colour for a small status dot. */
  dot: string;
  /** Icon shown inside the pill. */
  icon: LucideIcon;
}

const WARRANTY_STATUS_STYLES: Record<string, WarrantyStatusStyle> = {
  active: {
    label: "Active",
    badge:
      "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/30",
    dot: "bg-sky-500 dark:bg-sky-400",
    icon: ShieldCheck,
  },
  claim_submitted: {
    label: "Claimed",
    badge:
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30",
    dot: "bg-amber-500 dark:bg-amber-400",
    icon: Clock,
  },
  under_review: {
    label: "Review",
    badge:
      "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/30",
    dot: "bg-violet-500 dark:bg-violet-400",
    icon: ClipboardCheck,
  },
  info_requested: {
    label: "Needs Info",
    badge:
      "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-500/30",
    dot: "bg-orange-500 dark:bg-orange-400",
    icon: MessageCircleQuestion,
  },
  resolved: {
    label: "Resolved",
    badge:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    badge:
      "bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30",
    dot: "bg-slate-400 dark:bg-slate-300",
    icon: ShieldOff,
  },
};

/** Missing or unknown statuses fall back to the neutral grey look. */
export function getWarrantyStatusStyle(status?: string | null): WarrantyStatusStyle {
  const key = (status || "").trim().toLowerCase();
  return (
    WARRANTY_STATUS_STYLES[key] ?? {
      label: key ? key.replace(/_/g, " ") : "Unknown",
      badge:
        "bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30",
      dot: "bg-slate-400 dark:bg-slate-300",
      icon: Shield,
    }
  );
}
