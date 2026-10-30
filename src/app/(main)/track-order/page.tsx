import React from "react";
import Link from "next/link";
import {
  HelpCircle,
  PackageSearch,
  ShieldCheck,
} from "lucide-react";
import TrackOrdersClient, { type TrackableOrder } from "./TrackOrdersClient";
import { getUserSession } from "@/lib/core/session";
import { getOrdersByUserId } from "@/lib/api/orders";
import { formatOrderDate } from "@/lib/dateTime";

/**
 * The storefront's tracking entry point.
 *
 * It lists the signed-in customer's own orders rather than accepting an id and
 * an email: the page behind it shows a rider's live position and the code read
 * at the door, and neither should be reachable by guessing a number.
 */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Track Your Order",
  description: "Follow your order from the store to your doorstep.",
};

/** The order's newest row that could still be on the road. */
interface RawOrder {
  _id?: string;
  id?: string;
  createdAt?: string;
  orderStatus?: string;
  totalAmount?: number;
  items?: unknown[];
  shippingAddress?: { address?: string; city?: string } | null;
}

function normalizeOrder(raw: RawOrder): TrackableOrder {
  const id = String(raw?._id ?? raw?.id ?? "");
  const address = [raw?.shippingAddress?.address, raw?.shippingAddress?.city]
    .filter(Boolean)
    .join(", ");

  return {
    id,
    orderNumber: `#ORD-${id.slice(-6).toUpperCase()}`,
    placedAt: formatOrderDate(raw?.createdAt),
    status: String(raw?.orderStatus || "processing").toLowerCase(),
    items: Array.isArray(raw?.items) ? raw.items.length : 0,
    total: Number(raw?.totalAmount ?? 0),
    address,
  };
}

/** The orders list can arrive wrapped or bare, depending on the API version. */
function unwrapOrders(payload: unknown): RawOrder[] {
  if (Array.isArray(payload)) return payload as RawOrder[];
  const wrapped = (payload as { orders?: unknown } | null)?.orders;
  return Array.isArray(wrapped) ? (wrapped as RawOrder[]) : [];
}

export default async function TrackOrderPage() {
  const user = await getUserSession();
  let orders: TrackableOrder[] = [];

  if (user?.id) {
    try {
      const res = await getOrdersByUserId(user.id);
      orders = unwrapOrders(res?.data)
        .map(normalizeOrder)
        .filter((order) => order.id)
        // Newest first: the parcel someone is waiting on is the one on top.
        .sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1))
        .slice(0, 30);
    } catch (error) {
      console.error("Failed to load orders for tracking:", error);
    }
  }

  return (
    <section className="w-full text-[var(--foreground)] py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 space-y-10">
        {/* ── Page header ── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold tracking-wide uppercase">
            <PackageSearch className="w-4 h-4 stroke-[2.2]" />
            Order Lookup
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[var(--foreground)]">
            Track Your <span className="text-gradient-primary">Order</span>
          </h1>
          <p className="text-sm md:text-base text-[var(--foreground-muted)] max-w-lg mx-auto">
            Pick an order to see its stage, the rider carrying it, where they are right
            now, and the code you read out at the door.
          </p>
        </div>

        <TrackOrdersClient orders={orders} isSignedIn={Boolean(user)} />

        {/* ── Help cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="flex items-start gap-3.5 p-5 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Only your orders
              </h4>
              <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
                A rider&apos;s position is personal data. It is shown only to the
                account that placed the order, and only while the delivery is on the
                way.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-5 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl">
            <HelpCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Need support?
              </h4>
              <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
                Can&apos;t find an order? Check your confirmation email or{" "}
                <Link href="/contact" className="text-primary font-medium hover:underline">
                  contact support
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
