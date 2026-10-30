// ─── Warranty System Types ───────────────────────────────────────────────────

/**
 * One extra period an admin granted on top of the original coverage.
 * Kept as a history so the extra months can always be explained.
 */
export interface WarrantyExtension {
  months: number;
  previousExpiryDate: string | Date;
  newExpiryDate: string | Date;
  reason?: string;
  extendedBy?: string;
  createdAt?: string | Date;
}

/**
 * Raw warranty record as returned by the server API (MongoDB lean output).
 * Optional fields exist only when a claim has been filed or when the
 * product/order references are not populated.
 */
export interface RawWarranty {
  _id: string;
  id?: string;
  status: "active" | "expired" | "claim_submitted" | "under_review" | "resolved";
  activationDate?: string | Date;
  expiryDate: string | Date;
  // Snapshot of the product's warranty terms, taken at delivery.
  warrantyType?: string;
  warrantyPeriodMonths?: number;
  warrantyTerms?: string;
  // Why a closed record is closed: the date ran out, a claim was rejected, or
  // the goods went back. Absent on older records.
  closedReason?: "date" | "rejected" | "void";
  // Every extra period an admin has granted, oldest first.
  extensions?: WarrantyExtension[];
  // The cap and what is left of it, as the server reports them.
  maxExtensions?: number;
  extensionsLeft?: number;
  claimProblem?: string;
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
  // Recorded on the warranty itself, so it survives product edits.
  warrantyType?: string;
  warrantyPeriodMonths?: number;
  warrantyTerms?: string;
  claimProblem?: string;
  claimReason?: string;
  claimDescription?: string;
  claimImages?: string[];
  claimAdminNote?: string;
  resolutionDetails?: string;
  closedReason?: "date" | "rejected" | "void";
  extensions?: WarrantyExtension[];
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
  status: "active" | "expired" | "claim_submitted" | "under_review" | "resolved";
  // Warranty terms: from the product when it still exists, otherwise the copy
  // stored on the record.
  warrantyType?: string;
  warrantyPeriodMonths?: number;
  warrantyTerms?: string;
  claimProblem?: string;
  claimReason?: string;
  claimDescription?: string;
  claimImages?: string[];
  claimAdminNote?: string;
  resolutionDetails?: string;
  // Why a closed record is closed, so the dialog can explain it.
  closedReason?: "date" | "rejected" | "void";
  // Every extension already granted on this record.
  extensions?: WarrantyExtension[];
  // The cap and what is left of it, sent by the API so the button can be
  // disabled without hardcoding the number on the screen.
  maxExtensions?: number;
  extensionsLeft?: number;
  createdAt?: string;
}