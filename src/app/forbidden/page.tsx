import { Metadata } from "next";
import ForbiddenView from "@/components/shared/ForbiddenView";
import { getSiteSettings } from "@/lib/api/siteSettings";

export async function generateMetadata(): Promise<Metadata> {
  const res = await getSiteSettings();
  const siteName = res?.data?.siteName || "Sparq";

  return {
    title: "403 Forbidden - Access Denied",
    description: `You do not have permission to view or access this resource on ${siteName}.`,
  };
}

export default function ForbiddenPage() {
  return <ForbiddenView />;
}
