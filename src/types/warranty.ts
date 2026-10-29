// ─── Warranty System Types ───────────────────────────────────────────────────

/**
 * Raw warranty record as returned by the server API (MongoDB lean output).
 * Optional fields exist only when a claim has been filed or when the
 * product/order references are not populated.
 */
export interface RawWarranty {
  _id: string;
  id?: string;
  status: "active" | "expired" | "claim_submitted" | "under_review" | "info_requested" | "resolved";
  activationDate?: string | Date;
  expiryDate: string | Date;
  claimReason?: string;
  claimDescription?: string;
  claimImages?: string[];
  claimAdminNote?: string;
  resolutionDetails?: string;
  createdAt?: string;
  productId?: { _id?: string; id?: string; title?: string; slug?: string; image?: string; price?: number; warrantyPeriodMonths?: number; warrantyType?: string; warrantyTerms?: string };
  orderId?: { _id?: string; id?: string; orderNumber?: string; orderStatus?: string; totalAmount?: number };
  userId?: { _id?: string; id?: string; name?: string; email?: string };
}

/**
 * Normalized warranty shape consumed by the customer-facing client.
 */
export interface NormalizedWarranty {
  id: string;
  status: string;
  expiryDate: string | Date;
  activationDate?: string | Date;
  product?: {
    id?: string;
    title?: string;
    slug?: string;
    image?: string;
    price?: number;
    warrantyPeriodMonths?: number;
    warrantyType?: string;
    warrantyTerms?: string;
  };
  order?: { id?: string; orderNumber?: string; orderStatus?: string; totalAmount?: number };
  claimReason?: string;
  claimDescription?: string;
  claimImages?: string[];
  claimAdminNote?: string;
  resolutionDetails?: string;
}

/**
 * Normalized warranty shape consumed by the admin dashboard client.
 */
export interface NormalizedAdminWarranty {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  productId: string;
  productTitle?: string;
  productSlug?: string;
  productImage?: string;
  orderId: string;
  orderNumber?: string;
  activationDate?: string | Date;
  expiryDate: string | Date;
  status: "active" | "expired" | "claim_submitted" | "under_review" | "info_requested" | "resolved";
  claimReason?: string;
  claimDescription?: string;
  claimImages?: string[];
  claimAdminNote?: string;
  resolutionDetails?: string;
  createdAt?: string;
}