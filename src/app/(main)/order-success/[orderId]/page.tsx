import React from "react";
import OrderSuccessClient from "./OrderSuccessClient";
import { getUserSession } from "@/lib/core/session";
import { getOrderById } from "@/lib/api/orders";
import { Order } from "@/types";
import { getSiteSettings } from "@/lib/api/siteSettings";

export async function generateMetadata() {
  const res = await getSiteSettings();
  const siteName = res?.data?.siteName || "Sparq";

  return {
    title: "Order Confirmed",
    description: `Thank you for your order! Your order has been placed successfully on ${siteName}.`,
  };
}

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderSuccessPage({ params }: PageProps) {
  const { orderId } = await params;
  const user = await getUserSession();

  let initialOrder: Order | null = null;

  try {
    const res = await getOrderById(orderId);
    if (res?.success && res.data) {
      initialOrder = res.data;
    }
  } catch {
    // Backend unavailable during SSR — client will show fallback
  }

  return <OrderSuccessClient orderId={orderId} initialOrder={initialOrder} user={user} />;
}
