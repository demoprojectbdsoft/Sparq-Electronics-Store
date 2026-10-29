"use server";

import { serverFetch, serverMutation } from "../core/server";
import { getUserSession } from "../core/session";
import { adminBlockedResult } from "../core/roles";
import { withQuery } from "../core/query";

export const addToWishlist = async (productId: string) => {
  const user = await getUserSession();
  if (!user?.id) return null;

  const blocked = adminBlockedResult(user, "add products to wishlist");
  if (blocked) return blocked;

  return serverMutation("/wishlist", { userId: user.id, productId });
};

export const removeFromWishlist = async (productId: string) => {
  const user = await getUserSession();
  if (!user?.id) return null;
  return serverMutation(`/wishlist/${productId}`, { userId: user.id }, "DELETE");
};

export const isWishlisted = async (productId: string) => {
  const user = await getUserSession();
  if (!user?.id) return { isWishlisted: false };
  const res = await serverFetch(withQuery("/wishlist/is-wishlisted", { userId: user.id, productId }), true);
  return res?.data || { isWishlisted: false };
};
