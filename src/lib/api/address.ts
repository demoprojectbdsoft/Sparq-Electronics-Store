import { serverFetch } from "../core/server";

/**
 * The signed-in customer's saved shipping addresses.
 *
 * The backend takes the owner from the bearer token, so no user id is passed
 * and one customer can never see another customer's address book.
 */
export const getSavedAddresses = async () => {
  return serverFetch("/addresses", true);
};
