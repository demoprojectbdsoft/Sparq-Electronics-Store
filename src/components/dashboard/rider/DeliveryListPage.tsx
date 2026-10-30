import React from "react";
import { getRequiredRole } from "@/lib/core/session";
import { getRiderDeliveries } from "@/lib/api/deliveries";
import { expiredDeliveryIds } from "@/lib/rider";
import DeliveryListClient from "./DeliveryListClient";
import type { DeliveryFeed } from "@/types/delivery";

/**
 * The four rider list screens differ only in which stage they ask for, so one
 * server component reads the query, calls the API and hands the rows to one
 * client. Each page under /dashboard/rider is then three lines.
 */

export type RiderListScope = "requests" | "deliveries" | "active" | "history";

const SCOPE_CONFIG: Record<
  RiderListScope,
  {
    title: string;
    subtitle: string;
    emptyText: string;
    path: string;
    /** The stage the scope fixes, or null when the rider may choose. */
    status: string | null;
    showStatusFilter: boolean;
  }
> = {
  requests: {
    title: "Delivery Requests",
    subtitle: "Jobs the store has offered you. Answer them before they expire.",
    emptyText: "No open requests right now. New assignments will appear here.",
    path: "/dashboard/rider/requests",
    status: "assigned",
    showStatusFilter: false,
  },
  deliveries: {
    title: "My Deliveries",
    subtitle: "Every job assigned to you, whatever stage it is in.",
    emptyText: "No deliveries match these filters yet.",
    path: "/dashboard/rider/deliveries",
    status: null,
    showStatusFilter: true,
  },
  active: {
    title: "Active Delivery",
    subtitle: "The jobs you have accepted and are carrying right now.",
    emptyText: "Nothing on the road. Accept a request to start a delivery.",
    path: "/dashboard/rider/active",
    status: "active",
    showStatusFilter: false,
  },
  history: {
    title: "Delivery History",
    subtitle: "Completed, cancelled and declined jobs, newest first.",
    emptyText: "No finished deliveries yet.",
    path: "/dashboard/rider/history",
    status: "finished",
    showStatusFilter: false,
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

interface DeliveryListPageProps {
  scope: RiderListScope;
  searchParams: SearchParams;
}

export default async function DeliveryListPage({ scope, searchParams }: DeliveryListPageProps) {
  await getRequiredRole("rider");

  const config = SCOPE_CONFIG[scope];
  const params = await searchParams;

  const read = (key: string) => {
    const value = params?.[key];
    return typeof value === "string" ? value : undefined;
  };

  const page = Math.max(1, Number(read("page")) || 1);
  const requestedLimit = Number(read("limit"));
  const limit = [10, 20, 50].includes(requestedLimit) ? requestedLimit : 10;
  const search = read("search")?.trim() || "";

  const requestedSort = read("sort");
  const sort = ["newest", "oldest", "fee_desc"].includes(requestedSort || "")
    ? (requestedSort as string)
    : "newest";

  const status = config.status ?? read("status") ?? "all";

  const res = await getRiderDeliveries({ status, search, sort, page, limit });

  const feed: DeliveryFeed = res?.data ?? {
    deliveries: [],
    total: 0,
    pagination: { page, limit, total: 0, totalPages: 1 },
  };

  // Expiry is decided on the server's clock, so the client stays pure.
  const expiredIds = expiredDeliveryIds(feed.deliveries);

  return (
    <DeliveryListClient
      scope={scope}
      title={config.title}
      subtitle={config.subtitle}
      emptyText={config.emptyText}
      path={config.path}
      showStatusFilter={config.showStatusFilter}
      deliveries={feed.deliveries}
      expiredIds={expiredIds}
      pagination={feed.pagination}
      filters={{ status, search, sort, limit }}
    />
  );
}
