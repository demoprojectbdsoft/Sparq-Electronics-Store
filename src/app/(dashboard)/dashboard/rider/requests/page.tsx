import DeliveryListPage from "@/components/dashboard/rider/DeliveryListPage";

export const dynamic = "force-dynamic";

interface RiderRequestsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Jobs the store has offered this rider, waiting for an answer. */
export default function RiderRequestsPage({ searchParams }: RiderRequestsPageProps) {
  return <DeliveryListPage scope="requests" searchParams={searchParams} />;
}
