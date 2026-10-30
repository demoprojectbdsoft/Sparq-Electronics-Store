import { getRequiredRole } from "@/lib/core/session";

/** The rider overview is built in the next phase; this keeps the route real. */
export default async function RiderOverviewPage() {
  const rider = await getRequiredRole("rider");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)]">
          Welcome back, {rider.name || "Rider"}
        </h1>
        <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1">
          Your delivery workspace is ready. Requests and live deliveries appear here.
        </p>
      </div>
    </div>
  );
}
