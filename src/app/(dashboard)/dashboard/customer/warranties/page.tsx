import React from "react";
import CustomerWarrantyClient from "./CustomerWarrantyClient";
import { getMyWarranties } from "@/lib/api/warranty";
import { getUserSession } from "@/lib/core/session";
import type { RawWarranty, NormalizedWarranty } from "@/types";

function normalizeWarranty(w: RawWarranty): NormalizedWarranty {
  const id = w.id || w._id;
  const product = {
    id: w?.productId?._id || w?.productId?.id,
    title: w?.productId?.title,
    slug: w?.productId?.slug,
    image: w?.productId?.image,
    price: w?.productId?.price,
    warrantyPeriodMonths: w?.productId?.warrantyPeriodMonths,
    warrantyType: w?.productId?.warrantyType,
    warrantyTerms: w?.productId?.warrantyTerms,
  };
  const order = {
    id: w?.orderId?._id || w?.orderId?.id,
    orderNumber: w?.orderId?.orderNumber,
    orderStatus: w?.orderId?.orderStatus,
    totalAmount: w?.orderId?.totalAmount,
  };
  return {
    id,
    status: w.status,
    expiryDate: w.expiryDate,
    activationDate: w.activationDate,
    product,
    order,
    claimReason: w.claimReason,
    claimDescription: w.claimDescription,
    claimImages: w.claimImages,
    claimAdminNote: w.claimAdminNote,
    resolutionDetails: w.resolutionDetails,
  };
}

export default async function CustomerWarrantyPage() {
  const user = await getUserSession();
  let warranties: NormalizedWarranty[] = [];

  if (user?.id) {
    try {
      const res = await getMyWarranties();
      const raw: RawWarranty[] = res?.data?.warranties || res?.data || [];
      warranties = raw.map(normalizeWarranty);
    } catch (err) {
      console.error("Failed to fetch warranties:", err);
    }
  }

  return <CustomerWarrantyClient initialWarranties={warranties} />;
}