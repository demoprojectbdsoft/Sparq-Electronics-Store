import DeliveryListPage from "@/components/dashboard/rider/DeliveryListPage";

export const dynamic = "force-dynamic";

interface RiderHistoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Delivered, cancelled and declined jobs. */
export default function RiderHistoryPage({ searchParams }: RiderHistoryPageProps) {
  return <DeliveryListPage scope="history" searchParams={searchParams} />;
}
