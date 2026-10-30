"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Inbox, LogIn, Search, Truck } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

/**
 * The customer's own order list, filtered as they type.
 *
 * There is no order-id-and-email lookup here on purpose: the tracking page
 * carries the rider's position and the code read at the door, so it is opened
 * from an order the signed-in account already owns.
 */

export interface TrackableOrder {
  id: string;
  orderNumber: string;
  placedAt: string;
  /** The raw order status, so the row can say what stage it is at. */
  status: string;
  items: number;
  total: number;
  address: string;
}

interface TrackOrdersClientProps {
  orders: TrackableOrder[];
  isSignedIn: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  shipped: "bg-[var(--brand-flat)]/10 text-[var(--brand-flat)] border-[var(--brand-flat)]/25",
  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
  default: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
};

export default function TrackOrdersClient({ orders, isSignedIn }: TrackOrdersClientProps) {
  const router = useRouter();
  const { formatPrice } = useSiteSettings();
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((order) =>
      [order.orderNumber, order.id, order.address, order.status]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [orders, query]);

  return (
    <div className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-xs space-y-5">
      {isSignedIn ? (
        <>
          <div className="space-y-2">
            <label
              htmlFor="order-lookup"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]"
            >
              Find an order
            </label>
            <div className="flex items-center gap-2 bg-[var(--surface-alt)] border border-[var(--border-color)] rounded-2xl px-3.5 py-3">
              <Search className="w-4 h-4 text-[var(--foreground-muted)] shrink-0" />
              <input
                id="order-lookup"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Order number, address or stage — e.g. ORD-A1B2C3"
                className="w-full bg-transparent outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
              />
            </div>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Only orders placed on this account are listed.
            </p>
          </div>

          {matches.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-2 py-8">
              <Inbox className="w-8 h-8 text-[var(--foreground-muted)]" />
              <p className="text-sm font-bold text-[var(--foreground)]">
                {orders.length === 0 ? "No orders yet" : "No order matches that"}
              </p>
              <p className="text-xs text-[var(--foreground-muted)] max-w-sm">
                {orders.length === 0
                  ? "Once you place an order it appears here, with its rider and live position while it is on the way."
                  : "Try the order number from your confirmation email."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-color)] border-t border-[var(--border-color)]">
              {matches.map((order) => {
                const label = STATUS_LABELS[order.status] || order.status || "Processing";
                const tone = STATUS_STYLES[order.status] || STATUS_STYLES.default;

                return (
                  <li
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-extrabold text-[var(--foreground)]">
                          {order.orderNumber}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${tone}`}
                        >
                          {label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5 truncate">
                        {order.placedAt} · {order.items} item{order.items === 1 ? "" : "s"} ·{" "}
                        {formatPrice(order.total)}
                        {order.address ? ` · ${order.address}` : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push(`/track-order/${order.id}`)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] font-bold shadow-md shadow-primary/20 transition-colors cursor-pointer shrink-0"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Track order
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <LogIn className="w-9 h-9 text-[var(--foreground-muted)]" />
          <p className="text-sm font-bold text-[var(--foreground)]">
            Sign in to see your orders
          </p>
          <p className="text-xs text-[var(--foreground-muted)] max-w-sm">
            Live tracking shows the rider carrying your parcel, where they are and the
            code you read at the door. That is only ever shown to the account that
            placed the order.
          </p>
          <Link
            href="/auth/login?redirect=%2Ftrack-order"
            className="mt-1 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20"
          >
            <LogIn className="w-4 h-4" />
            Sign in to track
          </Link>
        </div>
      )}
    </div>
  );
}
