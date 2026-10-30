import React from "react";
import RiderEarningsClient from "./RiderEarningsClient";
import { getRequiredRole } from "@/lib/core/session";
import { getRiderDeliveries, getRiderStats } from "@/lib/api/deliveries";
import { getSiteSettings } from "@/lib/api/siteSettings";
import { getCurrencySymbol } from "@/lib/currency";
import type { DeliveryFeed, DeliveryRecord, RiderSeriesPoint, RiderStats } from "@/types/delivery";

export const dynamic = "force-dynamic";

const EARNINGS_WINDOW_DAYS = 30;

const EMPTY_STATS: RiderStats = {
  totalDeliveries: 0,
  completed: 0,
  active: 0,
  pendingRequests: 0,
  cancelled: 0,
  earnings: 0,
  earningsThisMonth: 0,
  earningsInWindow: 0,
  successRate: 0,
  avgDeliveryMinutes: 0,
};

export default async function RiderEarningsPage() {
  const rider = await getRequiredRole("rider");

  const [statsRes, deliveredRes, settingsRes] = await Promise.allSettled([
    getRiderStats({ days: EARNINGS_WINDOW_DAYS }),
    getRiderDeliveries({ status: "delivered", limit: 50, sort: "newest" }),
    getSiteSettings(),
  ]);

  const stats: RiderStats =
    statsRes.status === "fulfilled" && statsRes.value?.data?.stats
      ? (statsRes.value.data.stats as RiderStats)
      : EMPTY_STATS;

  const series: RiderSeriesPoint[] =
    statsRes.status === "fulfilled" && Array.isArray(statsRes.value?.data?.series)
      ? (statsRes.value.data.series as RiderSeriesPoint[])
      : [];

  const feed: DeliveryFeed | null =
    deliveredRes.status === "fulfilled" ? (deliveredRes.value?.data as DeliveryFeed) : null;
  const delivered: DeliveryRecord[] = feed?.deliveries ?? [];

  const currency =
    settingsRes.status === "fulfilled" ? settingsRes.value?.data?.currency : undefined;

  return (
    <RiderEarningsClient
      riderName={rider.name || "Rider"}
      stats={stats}
      series={series}
      delivered={delivered}
      windowDays={EARNINGS_WINDOW_DAYS}
      currencySymbol={getCurrencySymbol(currency)}
    />
  );
}
