import { serverFetch } from "../core/server";
import { withQuery } from "../core/query";

/**
 * Contact-page messages stored by the backend.
 *
 * Read-only: a message is created by `POST /contact` (a public visitor form),
 * and the admin only lists or deletes it here.
 */

export const getMessages = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return serverFetch(withQuery("/messages", params), true);
};
