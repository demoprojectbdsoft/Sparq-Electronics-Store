"use client";

/**
 * The warranty status pill used by the admin table and the details modal.
 * Colour and icon come from lib/warrantyStatusStyles.ts.
 */

import { getWarrantyStatusStyle } from "@/lib/warrantyStatusStyles";

const PILL_SIZES = {
  sm: "px-2.5 py-[3px] text-[10px] gap-1",
  md: "px-3 py-1 text-xs gap-1.5",
};

const ICON_SIZES = {
  sm: "w-3 h-3",
  md: "w-3.5 h-3.5",
};

interface WarrantyStatusBadgeProps {
  status?: string | null;
  /** Tight rows can drop the icon. */
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function WarrantyStatusBadge({
  status,
  showIcon = true,
  size = "md",
  className = "",
}: WarrantyStatusBadgeProps) {
  const style = getWarrantyStatusStyle(status);
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold whitespace-nowrap ${PILL_SIZES[size]} ${style.badge} ${className}`}
    >
      {showIcon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
      {style.label}
    </span>
  );
}
