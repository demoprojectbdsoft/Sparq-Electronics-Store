import { serverFetch } from "../core/server";
import { withQuery } from "../core/query";

export const getWishlistByUserId = async (userId: string) => {
  return serverFetch(`/wishlist/user/${userId}`, true);
};

export const getWishlist = getWishlistByUserId;

export const checkIsWishlisted = async (productId: string, userId: string) => {
  return serverFetch(withQuery("/wishlist/is-wishlisted", { userId, productId }), true);
};
