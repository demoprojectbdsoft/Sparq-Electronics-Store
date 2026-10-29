"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "../auth";
import { roleOf } from "./roles";

type Role = "admin" | "customer" | "user";

/** Reads the better-auth session for the current request. */
const readSession = async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
};

/** The signed-in user, or null when the request has no session. */
export const getUserSession = async () => {
  const session = await readSession();
  return session?.user ?? null;
};

/** The session token the backend expects as a Bearer credential. */
export const getToken = async (): Promise<string | null> => {
  const session = await readSession();
  return session?.session?.token ?? null;
};

/**
 * Returns the current user if they hold `role`, otherwise redirects.
 * Admin access also covers the demo admin account.
 */
export const getRequiredRole = async (role: Role) => {
  const user = await getUserSession();

  if (!user) {
    redirect("/auth/login");
  }

  const hasAccess =
    role === "admin"
      ? user.role === "admin" || roleOf(user) === "demoadmin"
      : user.role === role;

  if (!hasAccess) {
    redirect("/forbidden");
  }

  return user;
};
