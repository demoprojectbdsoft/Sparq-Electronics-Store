import { getRequiredRole } from "@/lib/core/session";

/**
 * Only riders reach the rider workspace. Everyone else is sent to /forbidden,
 * and a signed-out visitor to the login page.
 */
export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  await getRequiredRole("rider");
  return <>{children}</>;
}
