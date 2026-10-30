"use server";

import { revalidatePath } from "next/cache";
import { Promo } from "@/types";
import { serverMutation } from "../core/server";

export const addPromo = async (data: Partial<Promo> | Record<string, unknown>) => {
  const res = await serverMutation(`/promos`, data);
  try {
    revalidatePath("/");
  } catch {}
  return res;
};

export const updatePromo = async (
  id: string,
  data: Partial<Promo> | Record<string, unknown>
) => {
  const res = await serverMutation(`/promos/${id}`, data, "PATCH");
  try {
    revalidatePath("/");
  } catch {}
  return res;
};

export const deletePromo = async (id: string) => {
  const res = await serverMutation(`/promos/${id}`, {}, "DELETE");
  try {
    revalidatePath("/");
  } catch {}
  return res;
};
