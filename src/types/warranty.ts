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
  // Snapshot of the product's warranty terms, taken at delivery.
  warrantyType?: string;
  warrantyPeriodMonths?: number;
  warrantyTerms?: string;
  claimProblem?: string;
  claimReason?: string;
  claimDescription?: string;
  claimImages?: string[];
  // Follow-up answers the customer sent after the store asked for more info.
  claimReplies?: { message: string; createdAt?: string | Date }[];
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
  // Recorded on the warranty itself, so it survives product edits.
  warrantyType?: string;
  warrantyPeriodMonths?: number;
  warrantyTerms?: string;
  claimProblem?: string;
  claimReason?: string;
  claimDescription?: string;
  claimImages?: string[];
  claimReplies?: { message: string; createdAt?: string | Date }[];
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
  // Warranty terms: from the product when it still exists, otherwise the copy
  // stored on the record.
  warrantyType?: string;
  warrantyPeriodMonths?: number;
  warrantyTerms?: string;
  claimProblem?: string;
  claimReason?: string;
  claimDescription?: string;
  claimImages?: string[];
  claimReplies?: { message: string; createdAt?: string | Date }[];
  claimAdminNote?: string;
  resolutionDetails?: string;
  createdAt?: string;
}