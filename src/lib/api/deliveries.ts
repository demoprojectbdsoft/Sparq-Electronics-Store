import { serverFetch } from "../core/server";
import { withQuery } from "../core/query";

/** The rider's own dashboard numbers and chart series. */
export const getRiderStats = async (params?: Record<string, string | number | undefined>) => {
  return serverFetch(withQuery("/deliveries/stats", params), true);
};

/** The rider's own jobs, filtered and paged. */
export const getRiderDeliveries = async (params?: Record<string, string | number | undefined>) => {
  return serverFetch(withQuery("/deliveries", params), true);
};
