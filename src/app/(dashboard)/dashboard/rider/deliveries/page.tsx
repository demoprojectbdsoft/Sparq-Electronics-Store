import DeliveryListPage from "@/components/dashboard/rider/DeliveryListPage";

export const dynamic = "force-dynamic";

interface RiderDeliveriesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Every job this rider has held, filterable by stage. */
export default function RiderDeliveriesPage({ searchParams }: RiderDeliveriesPageProps) {
  return <DeliveryListPage scope="deliveries" searchParams={searchParams} />;
}
