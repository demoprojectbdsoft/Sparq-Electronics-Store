import type { DeliveryInvoice } from "@/types/delivery";

/**
 * Builds the rider's delivery invoice with jsPDF.
 *
 * It follows the same sheet as the customer's own order invoice — same greys,
 * same table, same footer — so a rider handing one over at a door is handing
 * over something that looks like the store's paper. jsPDF is imported on click
 * so it never joins the page bundle.
 *
 * The delivery fee line is the rider's own money and is drawn apart from the
 * order total, because the two are different sums and confusing them is the one
 * mistake this document cannot afford.
 */

const TEXT: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const LINE: [number, number, number] = [226, 232, 240];
const HEAD_FILL: [number, number, number] = [243, 244, 246];
const BRAND: [number, number, number] = [37, 99, 235];

/** Keeps the file name free of characters Windows/macOS reject. */
function safeFilePart(text: string): string {
  return text.replace(/[^a-z0-9._-]+/gi, "-");
}

/** "bkash" -> "bKash", the way the storefront spells it. */
function paymentLabel(method: string): string {
  switch ((method || "").toLowerCase()) {
    case "bkash":
      return "bKash";
    case "nagad":
      return "Nagad";
    case "rocket":
      return "Rocket";
    case "cod":
      return "Cash on Delivery";
    default:
      return method || "—";
  }
}

function shippingLabel(method: string): string {
  if (method === "free") return "Free Shipping";
  if (method === "express") return "Express Delivery";
  return "Standard Delivery";
}

function moment(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function downloadDeliveryInvoicePdf(
  invoice: DeliveryInvoice,
  formatMoney: (amount: number) => string
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const money = formatMoney;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 48;
  const right = pageWidth - 48;
  const bottom = pageHeight - 64;

  let y = 64;

  const ensureSpace = (needed: number) => {
    if (y + needed <= bottom) return;
    doc.addPage();
    y = 64;
  };

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

  const sectionTitle = (text: string) => {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(text.toUpperCase(), left, y);
    y += 8;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.8);
    doc.line(left, y, right, y);
    y += 18;
  };

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...TEXT);
  doc.text(invoice.store.name, left, y);

  doc.setFontSize(14);
  doc.setTextColor(...BRAND);
  doc.text("DELIVERY INVOICE", right, y, { align: "right" });

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const storeLine = [invoice.store.address, invoice.store.phone, invoice.store.email]
    .filter(Boolean)
    .join(" · ");
  if (storeLine) doc.text(storeLine, left, y);

  y += 10;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(1);
  doc.line(left, y, right, y);

  // ── Document metadata ─────────────────────────────────────────────────────
  y += 32;
  fieldLabel("Invoice number", left);
  fieldValue(invoice.invoiceNumber, left);

  fieldLabel("Order", left + 200);
  fieldValue(invoice.order.orderNumber, left + 200);

  fieldLabel("Order date", right, "right");
  fieldValue(moment(invoice.order.placedAt), right, "right");

  y += 44;
  fieldLabel("Payment", left);
  fieldValue(paymentLabel(invoice.order.paymentMethod), left);

  fieldLabel("Shipping method", left + 200);
  fieldValue(shippingLabel(invoice.order.shippingMethod), left + 200);

  fieldLabel("Order status", right, "right");
  fieldValue(invoice.order.status.replace(/^\w/, (c) => c.toUpperCase()), right, "right");

  // ── Who is carrying it ────────────────────────────────────────────────────
  y += 44;
  sectionTitle("Delivery");

  const riderBits = [
    invoice.rider?.name || "Unassigned",
    invoice.rider?.phone,
    [invoice.rider?.vehicleType, invoice.rider?.vehicleNumber].filter(Boolean).join(" · "),
  ].filter(Boolean);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  doc.text(String(riderBits[0]), left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  if (riderBits[1]) doc.text(String(riderBits[1]), left, y + 14);
  if (riderBits[2]) doc.text(String(riderBits[2]), left, y + 28);

  const metaX = left + 290;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("Assigned", metaX, y);
  doc.text("Stage", metaX, y + 30);
  doc.text("Road distance", metaX, y + 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  doc.text(moment(invoice.delivery.assignedAt), metaX, y + 14);
  doc.text(invoice.delivery.status.replace(/_/g, " "), metaX, y + 44);
  doc.text(
    invoice.delivery.distanceKm ? `${invoice.delivery.distanceKm.toFixed(1)} km` : "—",
    metaX,
    y + 74
  );

  y += 92;

  // ── Deliver to ────────────────────────────────────────────────────────────
  sectionTitle("Deliver To");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  doc.text(invoice.customer.name, left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  let detailY = y + 14;
  if (invoice.customer.phone) {
    doc.text(invoice.customer.phone, left, detailY);
    detailY += 14;
  }

  const addressLines = doc.splitTextToSize(
    [invoice.customer.address, invoice.customer.postalCode].filter(Boolean).join(", ") ||
      "No address recorded",
    240
  );
  doc.text(addressLines, left, detailY);
  y = detailY + addressLines.length * 12 + 20;

  // ── Items ─────────────────────────────────────────────────────────────────
  sectionTitle("Order Items");

  const colQty = left + 320;
  const colUnit = left + 410;
  const colTotal = right;

  const tableHeader = () => {
    ensureSpace(30);
    doc.setFillColor(...HEAD_FILL);
    doc.rect(left, y - 11, right - left, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("ITEM", left + 8, y + 3);
    doc.text("QTY", colQty, y + 3, { align: "right" });
    doc.text("UNIT PRICE", colUnit, y + 3, { align: "right" });
    doc.text("LINE TOTAL", colTotal - 8, y + 3, { align: "right" });
    y += 24;
  };

  tableHeader();

  invoice.items.forEach((item) => {
    const nameLines = doc.splitTextToSize(item.title, colQty - left - 60);
    const rowHeight = Math.max(22, nameLines.length * 12 + 10);
    ensureSpace(rowHeight + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(nameLines, left + 8, y + 3);

    doc.text(String(item.quantity), colQty, y + 3, { align: "right" });
    doc.text(money(item.price), colUnit, y + 3, { align: "right" });
    doc.text(money(item.price * item.quantity), colTotal - 8, y + 3, { align: "right" });

    y += rowHeight;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.line(left, y - 6, right, y - 6);
  });

  // ── Totals ────────────────────────────────────────────────────────────────
  ensureSpace(140);
  y += 10;

  const totalLine = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(...(bold ? TEXT : MUTED));
    doc.text(label, colUnit - 20, y, { align: "right" });
    doc.setTextColor(...TEXT);
    doc.text(value, right, y, { align: "right" });
    y += bold ? 22 : 16;
  };

  totalLine("Subtotal", money(invoice.totals.subtotal));
  totalLine("Shipping fee", money(invoice.totals.shipping));

  if (invoice.totals.discount > 0) {
    const suffix = invoice.totals.pointsRedeemed
      ? `Discount (${invoice.totals.pointsRedeemed} pts)`
      : "Discount";
    totalLine(suffix, `-${money(invoice.totals.discount)}`);
  }

  y += 2;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.line(colUnit - 120, y - 10, right, y - 10);
  y += 8;

  totalLine("Order total", money(invoice.totals.total), true);

  // ── The rider's own line ──────────────────────────────────────────────────
  y += 6;
  doc.setFillColor(...HEAD_FILL);
  doc.roundedRect(left, y, right - left, 42, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  doc.text("Your delivery fee for this job", left + 12, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Paid out with your weekly settlement", left + 12, y + 31);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND);
  doc.text(money(invoice.delivery.fee), right - 12, y + 26, { align: "right" });
  y += 62;

  // ── Footer ────────────────────────────────────────────────────────────────
  const footer = `${invoice.store.name} · ${invoice.invoiceNumber} · ${invoice.order.orderNumber} · generated ${moment(
    invoice.issuedAt
  )}`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setDrawColor(...LINE);
  doc.line(left, pageHeight - 52, right, pageHeight - 52);
  doc.text(footer, left, pageHeight - 36);

  const fileName = `${safeFilePart(invoice.store.name)}-delivery-${safeFilePart(
    invoice.order.orderNumber
  )}.pdf`;
  doc.save(fileName);
}
