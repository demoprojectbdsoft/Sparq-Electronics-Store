import React from "react";
import CartClient from "./CartClient";
import { getCartByUserId } from "@/lib/api/cart";
import { getUserSession } from "@/lib/core/session";
import { CartData } from "@/types";

export const metadata = {
  // The root layout appends "| <siteName>" from settings.
  title: "Shopping Cart",
  description:
    "View and manage items in your shopping cart, calculate shipping, apply coupons, and proceed to checkout.",
};

export default async function CartPage() {
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

  return <CartClient initialCart={initialCart} user={user} />;
}