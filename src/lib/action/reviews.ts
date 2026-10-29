"use server";

import { serverMutation, serverFetch } from "../core/server";
import { getUserSession } from "../core/session";
import { isAdminRole } from "../core/roles";
import { withQuery } from "../core/query";

export const addReview = async (data: { productId: string; rating: number; comment: string; images?: string[] }) => {
  const user = await getUserSession();
  if (isAdminRole(user)) {
    return { success: false, message: "Admins cannot submit reviews." };
  }
  return serverMutation(`/reviews`, { ...data, userId: user?.id, images: data.images ?? [] });
};

export const getReviews = async (productId: string) => {
  return serverFetch(withQuery("/reviews", { productId }));
};

export const updateReview = async (id: string, data: { rating?: number; comment?: string; images?: string[] }) => {
  return serverMutation(`/reviews/${id}`, data, "PATCH");
};

/** Edit an existing review left by the current user (owner-only on the server). */
export const editReview = async (
  id: string,
  data: { rating?: number; comment?: string; images?: string[] }
) => {
  return serverMutation(`/reviews/${id}`, data, "PATCH");
};

export const deleteReview = async (id: string) => {
  return serverMutation(`/reviews/${id}`, {}, "DELETE");
};