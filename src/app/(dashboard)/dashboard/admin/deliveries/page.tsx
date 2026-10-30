import React from "react";
import { getRequiredRole } from "@/lib/core/session";
import { getAdminDeliveries, getAdminDeliveryOverview } from "@/lib/api/deliveries";
import AdminDeliveriesClient from "./AdminDeliveriesClient";
import type {
  AdminDeliveryOverview,
  DeliveryFeed,
  DeliveryPagination,
} from "@/types/delivery";

export const dynamic = "force-dynamic";

interface AdminDeliveriesPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    sort?: string;
    page?: string;
    limit?: string;
    riderId?: string;
  }>;
}

const EMPTY_OVERVIEW: AdminDeliveryOverview = {
  statusCounts: {},
  total: 0,
  active: 0,
  waiting: 0,
  deliveredToday: 0,
  onlineRiders: 0,
  shippedWithoutRider: 0,
  onTheRoad: 0,
};

/**
 * The store's delivery board.
 *
 * Two reads: the board itself and the counters above it. Both are asked for at
 * the same moment so the numbers can never describe a different list than the
 * one on screen.
 */
export default async function AdminDeliveriesPage({ searchParams }: AdminDeliveriesPageProps) {
  await getRequiredRole("admin");

  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const requestedLimit = Number(params?.limit);
  const limit = [10, 20, 50].includes(requestedLimit) ? requestedLimit : 10;
  const status = params?.status || "all";
  const search = params?.search?.trim() || "";
  const sort = ["newest", "oldest", "fee_desc"].includes(params?.sort || "")
    ? (params?.sort as string)
    : "newest";

  const [feedRes, overviewRes] = await Promise.all([
    getAdminDeliveries({ status, search, sort, page, limit, riderId: params?.riderId }),
    getAdminDeliveryOverview(),
  ]);

  const fallbackPagination: DeliveryPagination = {
    page,
    limit,
    total: 0,
    totalPages: 1,
  };

  const feed: DeliveryFeed = feedRes?.data ?? {
    deliveries: [],
    total: 0,
    pendingRequests: 0,
    pagination: fallbackPagination,
  };

  const overview: AdminDeliveryOverview = overviewRes?.data ?? EMPTY_OVERVIEW;

  return (
    <AdminDeliveriesClient
      deliveries={feed.deliveries}
      pagination={feed.pagination ?? fallbackPagination}
      overview={overview}
      filters={{ status, search, sort, limit }}
    />
  );
}
