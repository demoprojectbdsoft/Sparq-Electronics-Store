import React from "react";
import CheckoutClient from "./CheckoutClient";
import { getCartByUserId } from "@/lib/api/cart";
import { getUserSession } from "@/lib/core/session";
import { CartData } from "@/types";
import { getSiteSettings } from "@/lib/api/siteSettings";

export async function generateMetadata() {
  const res = await getSiteSettings();
  const siteName = res?.data?.siteName || "Sparq";

  return {
    title: "Checkout",
    description: `Complete your order securely with ${siteName}. Enter your shipping address and choose from Cash on Delivery or instant mobile wallet payments (bKash, Rocket, Nagad).`,
  };
}

export default async function CheckoutPage() {
  const user = await getUserSession();
  let initialCart: CartData | null = null;

  if (user?.id) {
    try {
      const res = await getCartByUserId(user.id);
      if (res?.success && res.data) {
        initialCart = res.data;
      }
    } catch {
      // Unauthenticated or backend unavailable during SSR
    }
  }

  return <CheckoutClient initialCart={initialCart} user={user} />;
}
