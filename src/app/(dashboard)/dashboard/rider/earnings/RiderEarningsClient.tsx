"use client";

import React, { useMemo } from "react";
import { Card } from "@heroui/react";
import { CalendarDays, Coins, Receipt, TrendingUp, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatDayLabel, formatMoment } from "@/lib/rider";
import type { DeliveryRecord, RiderSeriesPoint, RiderStats } from "@/types/delivery";

interface RiderEarningsClientProps {
  riderName: string;
  stats: RiderStats;
  series: RiderSeriesPoint[];
  delivered: DeliveryRecord[];
  windowDays: number;
  currencySymbol: string;
}

export default function RiderEarningsClient({
  riderName,
  stats,
  series,
  delivered,
  windowDays,
  currencySymbol,
}: RiderEarningsClientProps) {
  const { formatPrice } = useSiteSettings();

  const chartData = useMemo(
    () => series.map((point) => ({ ...point, label: formatDayLabel(point.date) })),
    [series]
  );

  const averagePerJob = stats.completed > 0 ? stats.earnings / stats.completed : 0;
  const bestDay = series.reduce(
    (best, point) => (point.earnings > best.earnings ? point : best),
    { date: "", delivered: 0, cancelled: 0, earnings: 0 }
  );

  const tiles = [
    {
      title: "Total Earnings",
      value: formatPrice(stats.earnings),
      note: `${stats.completed} delivered job${stats.completed === 1 ? "" : "s"}`,
      icon: Wallet,
    },
    {
      title: "This Month",
      value: formatPrice(stats.earningsThisMonth),
      note: "Since the 1st",
      icon: CalendarDays,
    },
    {
      title: `Last ${windowDays} Days`,
      value: formatPrice(stats.earningsInWindow),
      note: bestDay.date
        ? `Best day ${formatDayLabel(bestDay.date)} · ${formatPrice(bestDay.earnings)}`
        : "No delivered fees yet",
      icon: TrendingUp,
    },
    {
      title: "Average Per Job",
      value: formatPrice(averagePerJob),
      note: "Delivered fees only",
      icon: Coins,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          My <span className="text-gradient-primary">Earnings</span>
        </h1>
        <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1">
          {riderName}, here is what your delivered jobs have paid. A job counts once it is delivered.
        </p>
      </div>

      {/* ── Tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card
              key={tile.title}
              className="bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground-muted)]">{tile.title}</span>
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                  {tile.value}
                </p>
                <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{tile.note}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Daily earnings ── */}
      <Card className="bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[var(--foreground)]">Daily Earnings</h3>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Fees from jobs delivered on each day ({currencySymbol})
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="riderEarningsGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(value) => `${currencySymbol}${Math.round(Number(value))}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-elevated)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "14px",
                  color: "var(--foreground)",
                  fontSize: "12px",
                }}
                formatter={(value: ValueType | undefined) => [
                  `${currencySymbol}${Number(value ?? 0).toFixed(2)}`,
                  "Earned",
                ]}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#riderEarningsGlow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Delivered jobs ── */}
      <Card className="bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[var(--foreground)]">Delivered Jobs</h3>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            The most recent {delivered.length} completed deliveries and what each paid.
          </p>
        </div>

        {delivered.length === 0 ? (
          <div className="px-6 pb-10 flex flex-col items-center text-center gap-2">
            <Wallet className="w-8 h-8 text-[var(--foreground-muted)]" />
            <p className="text-xs text-[var(--foreground-muted)]">
              No delivered jobs yet. Earnings appear here as soon as a delivery is completed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-alt)] text-[var(--foreground-muted)] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Delivered</th>
                  <th className="px-4 py-3 font-bold text-right">Order value</th>
                  <th className="px-6 py-3 font-bold text-right">Your fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {delivered.map((delivery) => (
                  <tr key={delivery._id} className="hover:bg-[var(--surface-alt)]/60 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-[var(--foreground)] whitespace-nowrap">
                      {delivery.orderNumber}
                      <span className="block text-[10px] font-medium text-[var(--foreground-muted)]">
                        {delivery.city || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">
                      {delivery.customerName || "Customer"}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--foreground-muted)] whitespace-nowrap">
                      {formatMoment(delivery.deliveredAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[var(--foreground-muted)] whitespace-nowrap">
                      {formatPrice(delivery.orderTotal)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{formatPrice(delivery.fee)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
