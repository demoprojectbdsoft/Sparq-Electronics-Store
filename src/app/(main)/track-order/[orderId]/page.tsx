import React from "react";
import Link from "next/link";
import { ArrowLeft, LogIn, PackageSearch, ShieldAlert } from "lucide-react";
import TrackingView from "@/components/tracking/TrackingView";
import { getDeliveryTracking } from "@/lib/api/deliveries";
import { getUserSession } from "@/lib/core/session";
import { geocodeAddress } from "@/lib/geo";
import type { DeliveryTracking } from "@/types/delivery";

/**
 * One order, on the map.
 *
 * The session is checked here rather than in the browser so the API call that
 * carries the buyer's code is made with that buyer's token. A missing session
 * and a refused order look the same on purpose: neither tells a stranger
 * whether the id exists.
 */

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { orderId } = await params;
  const res = await getDeliveryTracking(orderId);
  const order = (res?.data as DeliveryTracking | undefined)?.order;
  return {
    title: order ? `Tracking ${order.orderNumber}` : "Order Tracking",
    description: "Follow your order from the store to your door.",
  };
}

export default async function TrackOrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const user = await getUserSession();

  if (!user) {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center gap-3">
          <LogIn className="w-9 h-9 text-[var(--foreground-muted)]" />
          <h2 className="text-lg font-extrabold text-[var(--foreground)]">
            Sign in to track this order
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] max-w-sm">
            Tracking shows the rider carrying your parcel and the code you read at
            the door, so it is only shown to the account that placed the order.
          </p>
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(`/track-order/${orderId}`)}`}
            className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in
          </Link>
        </div>
      </Shell>
    );
  }

  const res = await getDeliveryTracking(orderId);
  const tracking = res?.data as DeliveryTracking | undefined;

  if (!tracking?.order) {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center gap-3">
          <ShieldAlert className="w-9 h-9 text-[var(--foreground-muted)]" />
          <h2 className="text-lg font-extrabold text-[var(--foreground)]">
            That order is not on your account
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] max-w-sm">
            Check the link you followed. If this is your order, open it from your
            order list and it will be tracked from there.
          </p>
          <Link
            href="/track-order"
            className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--foreground)] text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to my orders
          </Link>
        </div>
      </Shell>
    );
  }

  // Best effort: the map still works with the rider alone when the address
  // cannot be placed, and the page never waits on a lookup that failed.
  const destination = await geocodeAddress(tracking.order.address, tracking.order.city);

  return (
    <section className="w-full text-[var(--foreground)] py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4">
        <TrackingView initial={tracking} destination={destination} />
      </div>
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full text-[var(--foreground)] py-12 md:py-20">
      <div className="max-w-xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold tracking-wide uppercase">
            <PackageSearch className="w-4 h-4 stroke-[2.2]" />
            Order Tracking
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Track your <span className="text-gradient-primary">order</span>
          </h1>
        </div>
        <div className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-8 shadow-xs">
          {children}
        </div>
      </div>
    </section>
  );
}
