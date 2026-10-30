import React from "react";
import { getWarranties } from "@/lib/api/warranty";
import AdminWarrantiesClient from "./AdminWarrantiesClient";
import type { RawWarranty, NormalizedAdminWarranty } from "@/types";

export const dynamic = "force-dynamic";

interface AdminWarrantiesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    sort?: string;
    page?: string;
    limit?: string;
  }>;
}

function normalizeWarranty(w: RawWarranty): NormalizedAdminWarranty {
  return {
    id: w.id || w._id,
    userId: w?.userId?._id || w?.userId?.id || "",
    userName: w?.userId?.name,
    userEmail: w?.userId?.email,
    productId: w?.productId?._id || w?.productId?.id || "",
    productTitle: w?.productId?.title,
    productSlug: w?.productId?.slug,
    productImage: w?.productId?.image,
    orderId: w?.orderId?._id || w?.orderId?.id || "",
    orderNumber: w?.orderId?.orderNumber,
    activationDate: w.activationDate,
    expiryDate: w.expiryDate,
    status: w.status as NormalizedAdminWarranty["status"],
    // Live product terms first, then the copy saved on the warranty record when
    // the product has been edited or deleted.
    warrantyType: w?.productId?.warrantyType || w.warrantyType,
    warrantyPeriodMonths:
      w?.productId?.warrantyPeriodMonths ?? w.warrantyPeriodMonths,
    warrantyTerms: w?.productId?.warrantyTerms || w.warrantyTerms,
    claimProblem: w.claimProblem,
    claimReason: w.claimReason,
    claimDescription: w.claimDescription,
    claimImages: w.claimImages,
    claimReplies: w.claimReplies,
    claimAdminNote: w.claimAdminNote,
    resolutionDetails: w.resolutionDetails,
    createdAt: w.createdAt,
  };
}

export default async function AdminWarrantiesPage({ searchParams }: AdminWarrantiesPageProps) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 10;

  const query: Record<string, string | number | undefined> = {
    page,
    limit,
    search: params?.search,
    status: params?.status === "All" ? undefined : params?.status,
    sort: params?.sort,
  };

  let warranties: NormalizedAdminWarranty[] = [];
  let pagination = {
    page,
    limit,
    total: 0,
    totalPages: 1,
  };

  try {
    const res = await getWarranties(query);
    const raw: RawWarranty[] = res?.data?.warranties || res?.data || [];
    warranties = raw.map(normalizeWarranty);

    pagination = res?.data?.pagination ?? {
      page,
      limit,
      total: res?.data?.total ?? warranties.length,
      totalPages: Math.max(1, Math.ceil((res?.data?.total ?? warranties.length) / limit)),
    };
  } catch (err) {
    console.error("Failed to fetch admin warranties:", err);
  }

  return (
    <AdminWarrantiesClient
      initialWarranties={warranties}
      pagination={pagination}
    />
  );
}