"use server";

import { serverMutation } from "../core/server";

/**
 * Writes for the saved-address book.
 *
 * The owner is taken from the session on the server, so nothing here takes a
 * user id — and a logged-out caller is redirected to the login page.
 */

export interface SaveAddressInput {
  label?: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  isDefault?: boolean;
}

export const saveAddress = async (data: SaveAddressInput) => {
  return serverMutation("/addresses", data);
};

export const updateAddress = async (id: string, data: Partial<SaveAddressInput>) => {
  return serverMutation(`/addresses/${id}`, data, "PATCH");
};

/** Makes this the address checkout pre-fills from. */
export const setDefaultAddress = async (id: string) => {
  return serverMutation(`/addresses/${id}/default`, "", "PATCH");
};

export const removeAddress = async (id: string) => {
  return serverMutation(`/addresses/${id}`, "", "DELETE");
};
