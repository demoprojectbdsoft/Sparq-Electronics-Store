import { serverFetch } from "../core/server";
import { withQuery } from "../core/query";

export const getAllOrders = async (params?: Record<string, any>) => {
  return serverFetch(withQuery("/orders", params), true);
};

export const getOrdersByUserId = async (userId: string) => {
  return serverFetch(withQuery("/orders", { userId }), true);
};

export const getOrderById = async (id: string) => {
  return serverFetch(`/orders/${id}`, true);
};
