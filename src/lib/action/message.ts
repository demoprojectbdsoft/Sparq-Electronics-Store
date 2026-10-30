"use server";

import { serverMutation } from "../core/server";

/** Removes a contact message the admin has already dealt with. */
export const deleteMessage = async (id: string) => {
  return serverMutation(`/messages/${id}`, "", "DELETE");
};
