"use server";

import { serverMutation } from "../core/server";

/** Removes a contact message the admin has already dealt with. */
export const deleteMessage = async (id: string) => {
  return serverMutation(`/messages/${id}`, "", "DELETE");
};

/**
 * Replies to the visitor who wrote a contact message.
 * The server takes the address from the stored message, so the body carries
 * only what the admin typed.
 */
export const replyToMessage = async (
  id: string,
  data: { subject: string; message: string }
) => {
  return serverMutation(`/messages/${id}/reply`, data, "POST");
};
