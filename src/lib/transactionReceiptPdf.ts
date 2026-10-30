import type { jsPDF } from "jspdf";
import type { CustomerTransaction } from "@/types/customerDashboard";

/**
 * Builds a one-page PDF receipt for a single payment, using jsPDF.
 *
 * Same idea as lib/orderInvoicePdf.ts: the library is imported only when the
 * button is clicked, so it never lands in the page bundle. Everything drawn
 * here comes from the transaction row the page already shows — no extra API
 * call is needed.
 */

const TEXT: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const LINE: [number, number, number] = [226, 232, 240];
const FILL: [number, number, number] = [243, 244, 246];

interface ReceiptOptions {
  siteName: string;
  /** The site's own money formatter, so the receipt uses the right currency. */
  formatPrice: (amount: number) => string;
  /** Shown when the page already knows who is signed in. */
  customerName?: string;
  customerEmail?: string;
}

/** Keeps the file name free of characters Windows/macOS reject. */
function safeFilePart(text: string): string {
  return text.replace(/[^a-z0-9._-]+/gi, "-");
}

/** Long values are trimmed so a fixed grid line can never run into its neighbour. */
function fit(doc: jsPDF, text: string, width: number): string {
  const lines = doc.splitTextToSize(text, width);
  return lines[0] ?? text;
}

/** The sentence under the amount, chosen from the payment status. */
function statusNote(status: CustomerTransaction["status"]): string {
  switch (status) {
    case "Completed":
      return "Payment received. Thank you for your order.";
    case "Pending":
      return "This payment is still pending and will settle once the order is delivered.";
    case "Failed":
      return "This payment did not go through. No money was taken for it.";
    case "Refunded":
      return "This payment has been refunded to the original payment method.";
    default:
      return "";
  }
}

export async function downloadTransactionReceiptPdf(
  transaction: CustomerTransaction,
  options: ReceiptOptions
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const money = options.formatPrice;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 48;
  const right = pageWidth - 48;

  let y = 64;

  const fieldLabel = (text: string, x: number, align: "left" | "right" = "left") => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(text.toUpperCase(), x, y, { align });
  };

  const fieldValue = (text: string, x: number, align: "left" | "right" = "left") => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...TEXT);
    doc.text(text, x, y + 15, { align });
  };

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...TEXT);
  doc.text(options.siteName, left, y);

  doc.setFontSize(14);
  doc.text("PAYMENT RECEIPT", right, y, { align: "right" });

  y += 12;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(1);
  doc.line(left, y, right, y);

  // ── Transaction details ───────────────────────────────────────────────────
  const colMid = left + 240;

  y += 34;
  fieldLabel("Receipt No", left);
  fieldValue(fit(doc, transaction.invoiceNumber || "—", 220), left);

  fieldLabel("Status", colMid);
  fieldValue(transaction.status, colMid);

  y += 46;
  fieldLabel("Date", left);
  fieldValue(transaction.date || "—", left);

  fieldLabel("Payment Method", colMid);
  fieldValue(fit(doc, transaction.paymentMethod || "Not provided", 220), colMid);

  y += 46;
  fieldLabel("Order Number", left);
  fieldValue(transaction.orderNumber || "—", left);

  fieldLabel("Type", colMid);
  fieldValue(transaction.type, colMid);

  // ── Amount card ───────────────────────────────────────────────────────────
  y += 44;
  doc.setFillColor(...FILL);
  doc.rect(left, y, right - left, 78, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("AMOUNT", left + 16, y + 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...TEXT);
  doc.text(money(transaction.amount || 0), left + 16, y + 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(transaction.status, right - 16, y + 24, { align: "right" });
  doc.text(transaction.paymentMethod || "—", right - 16, y + 42, { align: "right" });

  y += 100;

  // ── Note ──────────────────────────────────────────────────────────────────
  const note = statusNote(transaction.status);
  if (note) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    const noteLines = doc.splitTextToSize(note, right - left);
    doc.text(noteLines, left, y);
    y += noteLines.length * 13;
  }

  // ── Customer ──────────────────────────────────────────────────────────────
  if (options.customerName || options.customerEmail) {
    y += 26;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.8);
    doc.line(left, y, right, y);
    y += 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("BILLED TO", left, y);
    y += 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    if (options.customerName) doc.text(options.customerName, left, y);
    if (options.customerEmail) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(options.customerEmail, left, y + 14);
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setDrawColor(...LINE);
  doc.line(left, pageHeight - 52, right, pageHeight - 52);
  doc.text(
    `${options.siteName} - receipt ${transaction.invoiceNumber} - generated ${generatedAt}`,
    left,
    pageHeight - 36
  );
  doc.text("Computer-generated receipt, no signature required.", right, pageHeight - 36, {
    align: "right",
  });

  const fileName = `${safeFilePart(options.siteName)}-receipt-${safeFilePart(
    transaction.invoiceNumber || transaction.id
  )}.pdf`;
  doc.save(fileName);
}
