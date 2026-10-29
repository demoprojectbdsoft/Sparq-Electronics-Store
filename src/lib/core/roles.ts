/**
 * Role helpers shared by the server actions and layouts.
 *
 * Roles arrive from the session user as free-form strings ("Admin", "ADMIN",
 * "demoadmin", ...), so every comparison goes through a lowercased form.
 */

type RoleCarrier = { role?: string | null } | null | undefined;

/** The user's role, lowercased, or "" when unknown. */
export function roleOf(user: RoleCarrier): string {
  return (user?.role || "").toLowerCase();
}

/**
 * Admin and demo admin have the same authority; the demo admin is only
 * sandboxed on the backend (undoable writes), not by permission checks.
 */
export function isAdminRole(user: RoleCarrier): boolean {
  const role = roleOf(user);
  return role === "admin" || role === "demoadmin";
}

/**
 * Shops are for customers, so admins are blocked from cart/wishlist/review
 * actions. Returns the failure payload to send back, or null when allowed.
 */
export function adminBlockedResult(user: RoleCarrier, action: string) {
  if (!isAdminRole(user)) return null;

  const who = roleOf(user) === "demoadmin" ? "Demo admin" : "Admin";
  return { success: false as const, message: `${who} cannot ${action}!` };
}
