"use server";

import { serverMutation } from "../core/server";
import { getUserSession } from "../core/session";
import { isAdminRole } from "../core/roles";

/**
 * Customer: submit a warranty claim for one of their own warranties.
 * The caller's identity is resolved server-side from the auth token, so the
 * request body only carries the warranty reference and the claim details.
 */
export const submitWarrantyClaim = async (
  warrantyId: string,
  data: {
    reason: string;
    description: string;
    images?: string[];
  }
) => {
  const user = await getUserSession();
  if (!user?.id) {
    return { success: false, message: "Authentication required." };
  }
  return serverMutation(`/warranties/claim/${warrantyId}`, data, "POST");
};

/**
 * Admin: process a claim — mark under review, request info, resolve, or reject.
 */
export const adminUpdateClaim = async (
  warrantyId: string,
  data: {
    action: "mark_under_review" | "request_info" | "resolve" | "reject";
    adminNote?: string;
    resolution?: string;
  }
) => {
  const user = await getUserSession();
  if (!isAdminRole(user)) {
    return { success: false, message: "Admin access required." };
  }
  return serverMutation(`/warranties/claim/${warrantyId}`, data, "PATCH");
};

/**
 * Admin: email the customer about one warranty. Only the subject and message are
 * sent; the server reads the address from the warranty record itself.
 */
export const emailWarrantyCustomer = async (
  warrantyId: string,
  data: { subject: string; message: string }
) => {
  const user = await getUserSession();
  if (!isAdminRole(user)) {
    return { success: false, message: "Admin access required." };
  }
  return serverMutation(`/warranties/email/${warrantyId}`, data, "POST");
};