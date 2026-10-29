"use server";

import { serverFetch } from "../core/server";

/**
 * Collects the caller's own site data — profile, orders, payments, reviews,
 * wishlist, cart and warranties — so the settings page can save it as a JSON
 * file before the account is deleted.
 *
 * The API decides whose data this is: it reads the id from the session token,
 * so this can only ever return the signed-in customer's records.
 */
export const exportMyAccountData = async () => {
  const res = await serverFetch("/users/me/export", true);

  if (!res?.data) {
    return { success: false as const, message: "Could not collect your data. Please try again." };
  }

  return { success: true as const, data: res.data };
};
