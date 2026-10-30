import { serverFetch } from "../core/server";
import { withQuery } from "../core/query";

/**
 * Contact-page messages stored by the backend.
 *
 * Read-only here: a message is created by `POST /contact` (a public visitor
 * form), and the admin lists, replies to or deletes it from the dashboard.
 */

export const getMessages = async (params?: {
  status?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  return serverFetch(withQuery("/messages", params), true);
};
