import React from "react";
import { getWarranties } from "@/lib/api/warranty";
import AdminWarrantiesClient from "./AdminWarrantiesClient";
import type { RawWarranty, NormalizedAdminWarranty } from "@/types";

export const dynamic = "force-dynamic";

interface AdminWarrantiesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    warrantyType?: string;
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
    // The type saved on the record wins, because that is the cover the order was
    // actually sold with: the server filters and extends by this same field, and
    // only an extended-warranty record may take extra months. The live product is
    // only a fallback for older records that never stored a copy.
    warrantyType: w.warrantyType || w?.productId?.warrantyType,
    warrantyPeriodMonths:
      w?.productId?.warrantyPeriodMonths ?? w.warrantyPeriodMonths,
    warrantyTerms: w?.productId?.warrantyTerms || w.warrantyTerms,
    // Why a closed record is closed, and every extension already granted.
    closedReason: w.closedReason,
    extensions: Array.isArray(w.extensions) ? w.extensions : [],
    maxExtensions: w.maxExtensions,
    extensionsLeft: w.extensionsLeft,
    claimProblem: w.claimProblem,
    claimReason: w.claimReason,
    claimDescription: w.claimDescription,
    claimImages: w.claimImages,
    claimAdminNote: w.claimAdminNote,
    resolutionDetails: w.resolutionDetails,
    createdAt: w.createdAt,
  };
}

export default async function AdminWarrantiesPage({ searchParams }: AdminWarrantiesPageProps) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 10;

  // No status in the URL means the default view: only what customers claimed.
  // "all" is the explicit way to ask for every warranty, so it drops the filter.
  const status = params?.status;
  const query: Record<string, string | number | undefined> = {
    page,
    limit,
    search: params?.search,
    status: status === "all" ? undefined : status || "claimed",
    // "all" warranty types is the same as no warranty-type filter at all.
    warrantyType: params?.warrantyType === "all" ? undefined : params?.warrantyType,
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