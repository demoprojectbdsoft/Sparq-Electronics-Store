import { serverFetch } from "../core/server";
import { withQuery } from "../core/query";

export const getSubCategories = async (categoryId?: string) => {
  return serverFetch(withQuery("/subcategories", { categoryId }));
};
