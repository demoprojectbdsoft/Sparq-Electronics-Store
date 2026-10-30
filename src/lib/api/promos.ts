import { serverFetch } from "../core/server";
import { withQuery } from "../core/query";

// No token needed: the storefront reads banners the same way the dashboard does,
// and `isActive=true` is what limits the public page to the live ones.
export const getPromos = async (
  params?: Record<string, string | number | boolean | undefined>
): Promise<any> => {
  return serverFetch(withQuery("/promos", params));
};
