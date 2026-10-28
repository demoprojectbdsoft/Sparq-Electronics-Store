"use server";

import { serverMutation, serverFetch } from "../core/server";
import { getUserSession } from "../core/session";

export const addReview = async (data: { productId: string; rating: number; comment: string; images?: string[] }) => {
  const user = await getUserSession();
  const role = ((user as { role?: string })?.role || "").toLowerCase();
  if (role === "demoadmin" || role === "admin") {
    return { success: false, message: "Admins cannot submit reviews." };
  }
  return serverMutation(`/reviews`, { ...data, userId: user?.id, images: data.images ?? [] });
};

export const getReviews = async (productId: string) => {
  return serverFetch(`/reviews?productId=${productId}`);
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