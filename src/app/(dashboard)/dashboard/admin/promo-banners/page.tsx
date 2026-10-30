import { getPromos } from "@/lib/api/promos";
import PromoBannersClient from "./PromoBannersClient";

// The list has to be fresh every time, because toggling a banner here changes
// what the homepage shows on the very next visit.
export const dynamic = "force-dynamic";

export default async function AdminPromoBannersPage() {
  const res = await getPromos();

  // The API wraps the list as { data: [...] }. Stay tolerant of a bare array so
  // a small change on the server never breaks this screen.
  const promos = Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res)
    ? res
    : [];

  return <PromoBannersClient initialPromos={promos} />;
}
