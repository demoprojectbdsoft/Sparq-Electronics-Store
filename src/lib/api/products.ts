import { serverFetch } from "../core/server";
import { withQuery } from "../core/query";

// Filter/sort/pagination params are forwarded as-is; empty values are dropped.
export const getProducts = async (
  params?: Record<string, string | number | boolean | undefined>
): Promise<any> => {
  return serverFetch(withQuery("/products", params));
};

export const getProductBySlug = async (slug: string) => {
  return serverFetch(`/products/${slug}`);
};