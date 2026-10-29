import { serverFetch } from "../core/server";
import { withQuery } from "../core/query";

export const getTransactions = async (params?: Record<string, any>) => {
  return serverFetch(withQuery("/transactions", params), true);
};

export const getTransactionsByUserId = async (userId: string) => {
  return serverFetch(withQuery("/transactions", { userId }), true);
};

export const getTransactionsByOrderId = async (orderId: string) => {
  return serverFetch(withQuery("/transactions", { orderId }), true);
};
