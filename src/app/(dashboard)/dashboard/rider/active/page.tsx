import DeliveryListPage from "@/components/dashboard/rider/DeliveryListPage";

export const dynamic = "force-dynamic";

interface RiderActivePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Accepted, picked up and out-for-delivery jobs. */
export default function RiderActivePage({ searchParams }: RiderActivePageProps) {
  return <DeliveryListPage scope="active" searchParams={searchParams} />;
}
