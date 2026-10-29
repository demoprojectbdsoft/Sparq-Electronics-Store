"use client";

/**
 * The one order status pill used across the app.
 *
 * Customer orders, the tracking modal, both dashboards and the admin status
 * picker all render this, so a status can never pick up two different colours.
 * Colour and icon come from lib/orderStatusStyles.ts.
 */

import { getOrderStatusLabel, getOrderStatusStyle } from "@/lib/orderStatusStyles";

const PILL_SIZES = {
  sm: "px-2.5 py-[3px] text-[10px] gap-1",
  md: "px-3 py-1 text-xs gap-1.5",
};

const ICON_SIZES = {
  sm: "w-3 h-3",
  md: "w-3.5 h-3.5",
};

interface OrderStatusBadgeProps {
  status?: string | null;
  /** Table cells and other tight rows can drop the icon. */
  showIcon?: boolean;
  /** Adds a pulsing dot for orders that are moving right now. */
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function OrderStatusBadge({
  status,
  showIcon = true,
  pulse = false,
  size = "md",
  className = "",
}: OrderStatusBadgeProps) {
  const style = getOrderStatusStyle(status);
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold whitespace-nowrap ${PILL_SIZES[size]} ${style.badge} ${className}`}
    >
      {pulse && <span className={`w-1.5 h-1.5 rounded-full animate-ping ${style.dot}`} />}
      {showIcon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
      {getOrderStatusLabel(status)}
    </span>
  );
}
