import React from "react";
import RiderOverviewClient from "./RiderOverviewClient";
import { getRequiredRole } from "@/lib/core/session";
import { getRiderStats } from "@/lib/api/deliveries";
import { getSiteSettings } from "@/lib/api/siteSettings";
import { getCurrencySymbol } from "@/lib/currency";
import { riderStatCards } from "@/lib/rider";
import type { RiderStatsResult } from "@/types/delivery";

export const dynamic = "force-dynamic";

/** The chart ranges the overview offers. */
const RIDER_RANGE_DAYS = [7, 14, 30, 90];

/** A quiet rider still deserves a page, so a failed read renders zeroes. */
function emptyStats(days: number): RiderStatsResult {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));

  return {
    stats: {
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
    },
    statusCounts: {
      assigned: 0,
      accepted: 0,
      picked_up: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      declined: 0,
    },
    series: [],
    recent: [],
    range: {
      days,
      from: from.toISOString().split("T")[0],
      to: now.toISOString().split("T")[0],
    },
  };
}

interface RiderOverviewPageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function RiderOverviewPage({ searchParams }: RiderOverviewPageProps) {
  const rider = await getRequiredRole("rider");

  const params = await searchParams;
  const requested = Number(params?.days);
  const days = RIDER_RANGE_DAYS.includes(requested) ? requested : 14;

  const [statsRes, settingsRes] = await Promise.allSettled([
    getRiderStats({ days }),
    getSiteSettings(),
  ]);

  const result: RiderStatsResult =
    statsRes.status === "fulfilled" && statsRes.value?.data
      ? (statsRes.value.data as RiderStatsResult)
      : emptyStats(days);

  const currency =
    settingsRes.status === "fulfilled" ? settingsRes.value?.data?.currency : undefined;
  const currencySymbol = getCurrencySymbol(currency);
  const money = (value: number) =>
    `${currencySymbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <RiderOverviewClient
      riderName={rider.name || "Rider"}
      stats={result.stats}
      statusCounts={result.statusCounts}
      series={result.series}
      recent={result.recent}
      range={result.range}
      cards={riderStatCards(result.stats, money)}
      days={days}
    />
  );
}
