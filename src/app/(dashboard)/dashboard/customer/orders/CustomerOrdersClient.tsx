"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  Button,
  Input,
  Chip,
} from "@heroui/react";
import {
  ShoppingBag,
  Package,
  Truck,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Download,
  RotateCcw,
  Star,
  ChevronRight,
  Copy,
  XCircle,
  PackageCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { authClient } from "@/lib/auth-client";
import SuspendedAccountModal from "@/components/shared/SuspendedAccountModal";
import { CustomerOrder, CustomerOrderItem } from "@/types/customerDashboard";
import { submitCustomerOrderResponse } from "@/lib/action/orders";
import { addToCart } from "@/lib/action/cart";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const STATUS_TABS = ["All Orders", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

/** Human-readable label for the shipping option stored on an order.
 *  Pre-existing orders have no method stored — assume Standard Delivery. */
function shippingMethodLabel(method?: CustomerOrder["shippingMethod"]): string {
  switch (method) {
    case "free":    return "Free Shipping";
    case "express": return "Express Delivery";
    case "standard":return "Standard Delivery";
    default:        return "Standard Delivery";
  }
}

interface CustomerOrdersClientProps {
  initialOrders: CustomerOrder[];
}

export default function CustomerOrdersClient({ initialOrders = [] }: CustomerOrdersClientProps) {
  const { formatPrice } = useSiteSettings();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isSuspended = ((user as { status?: string })?.status || "").toLowerCase() === "suspended";
  const [showSuspendedAlert, setShowSuspendedAlert] = useState(false);

  const [orders, setOrders] = useState<CustomerOrder[]>(
    Array.isArray(initialOrders) ? initialOrders : []
  );
  const [selectedTab, setSelectedTab] = useState("All Orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingModalOrder, setTrackingModalOrder] = useState<CustomerOrder | null>(null);

  // Customer Response State
  const [responseModalOrder, setResponseModalOrder] = useState<CustomerOrder | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<"received" | "not_received" | "cancelled">("received");
  const [responseNote, setResponseNote] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesTab =
      selectedTab === "All Orders" ||
      order.status.toLowerCase() === selectedTab.toLowerCase();
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const userRole = ((user as { role?: string })?.role || "").toLowerCase();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const handleDownloadInvoice = (orderNumber: string) => {
    toast.success(`Downloading Invoice for order ${orderNumber}...`);
  };

  const handleBuyAgain = async (item: CustomerOrderItem) => {
    if (isSuspended) {
      setShowSuspendedAlert(true);
      return;
    }

    if (userRole === "admin" || userRole === "demoadmin") {
      toast.warning(
        userRole === "demoadmin"
          ? "Demo admin cannot add products to cart!"
          : "Admin cannot add products to cart!"
      );
      return;
    }

    const isOutOfStock =
      item.inStock === false ||
      (item.stockQuantity != null && item.stockQuantity <= 0);

    if (isOutOfStock) {
      toast.warning(`"${item.name}" is currently out of stock!`, {
        icon: <span>⚠️</span>,
      });
      return;
    }

    const productId = item.productId || item.id;
    if (!productId) {
      toast.error("Product information unavailable to reorder.");
      return;
    }

    try {
      setLoadingItemId(item.id);
      const res = await addToCart(productId, 1);
      if (res?.success) {
        toast.success(`"${item.name}" added to cart!`, {
          icon: <span>🛒</span>,
        });
        window.dispatchEvent(new CustomEvent("cart-updated"));
      } else {
        const errorMsg = res?.message || "Failed to add to cart";
        if (
          errorMsg.toLowerCase().includes("out of stock") ||
          errorMsg.toLowerCase().includes("stock")
        ) {
          toast.warning(errorMsg, {
            icon: <span>⚠️</span>,
          });
        } else {
          toast.error(errorMsg);
        }
      }
    } catch {
      toast.error("Failed to add product to cart");
    } finally {
      setLoadingItemId(null);
    }
  };

  const copyTracking = (tracking: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tracking);
      toast.info(`Tracking #${tracking} copied to clipboard!`);
    }
  };

  const handleOpenResponseModal = (order: CustomerOrder) => {
    setResponseModalOrder(order);
    setSelectedResponse(order.customerResponse || "received");
    setResponseNote(order.customerResponseNote || "");
  };

  const handleSubmitResponse = async () => {
    if (!responseModalOrder) return;
    setIsSubmittingResponse(true);

    try {
      const res = await submitCustomerOrderResponse(
        responseModalOrder.id,
        selectedResponse,
        responseNote.trim()
      );

      if (res?.success !== false) {
        toast.success(
          selectedResponse === "received"
            ? "Thank you! Your delivery confirmation has been sent to the store."
            : selectedResponse === "not_received"
            ? "Your report has been submitted. The store admin has been alerted."
            : "Cancellation request submitted. The store admin has been alerted."
        );

        setOrders((prev) =>
          prev.map((o) =>
            o.id === responseModalOrder.id
              ? {
                  ...o,
                  customerResponse: selectedResponse,
                  customerResponseNote: responseNote.trim(),
                  customerResponseAt: new Date().toISOString(),
                }
              : o
          )
        );
        setResponseModalOrder(null);
      } else {
        toast.error(res?.message || "Failed to submit response");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error submitting response");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  return (
    <>
    <SuspendedAccountModal
      isOpen={showSuspendedAlert}
      onOpenChange={setShowSuspendedAlert}
      message="Your account has been suspended. You are not allowed to add items to the cart or reorder. Please contact support for assistance."
    />

    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] mb-1">
            <Link href="/dashboard/customer" className="hover:text-primary transition-colors">
              Customer Dashboard
            </Link>
            <span>/</span>
            <span className="text-primary font-bold">My Orders</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Order History &amp;{" "}
            <span className="text-gradient-primary">
              Tracking
            </span>
          </h1>
          <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1">
            Track active shipments, manage past deliveries, and download receipts.
          </p>
        </div>

        <Link
          href="/shop"
          className="bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 transition-all cursor-pointer self-start sm:self-auto h-10 px-4 rounded-xl flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop More Items</span>
        </Link>
      </div>

      {/* ── Tabs & Search Bar ── */}
      <div className="space-y-4">
        {/* Status Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => {
            const count =
              tab === "All Orders"
                ? orders.length
                : orders.filter((o) => o.status.toLowerCase() === tab.toLowerCase()).length;

            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTab === tab
                    ? "bg-primary text-white shadow-xs font-bold"
                    : "bg-[var(--surface-alt)] text-[var(--foreground-muted)] hover:bg-[var(--surface-alt)]/80 hover:text-[var(--foreground)] border border-[var(--border-color)]"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedTab === tab
                      ? "bg-[var(--surface-elevated)]/20 text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--foreground-muted)] border border-[var(--border-color)]/50"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] z-10" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number (e.g. #ORD-9582) or product title..."
            className="w-full pl-9 pr-4 h-10 bg-[var(--surface-alt)] border border-[var(--border-color)] focus:border-primary rounded-xl text-xs transition-all text-[var(--foreground)] shadow-xs"
          />
        </div>
      </div>

      {/* ── Orders Cards List ── */}
      {filteredOrders.length === 0 ? (
        <Card className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              No orders found
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              {searchQuery
                ? "No orders matched your search keyword."
                : `You do not have any ${selectedTab !== "All Orders" ? selectedTab.toLowerCase() : ""} orders yet.`}
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 transition-all"
          >
            <span>Start Shopping</span>
          </Link>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs space-y-4 p-0"
            >
              {/* Order Card Header */}
              <div className="p-4 sm:p-5 bg-[var(--surface-alt)] border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span className="text-[var(--foreground-muted)] text-[10px] uppercase font-bold block">
                      Order Number
                    </span>
                    <span className="font-extrabold text-[var(--foreground)]">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--foreground-muted)] text-[10px] uppercase font-bold block">
                      Date Placed
                    </span>
                    <span className="font-semibold text-[var(--foreground)] opacity-90">
                      {order.date}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--foreground-muted)] text-[10px] uppercase font-bold block">
                      Total Amount
                    </span>
                    <span className="font-black text-[var(--foreground)]">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--foreground-muted)] text-[10px] uppercase font-bold block">
                      Shipping Method
                    </span>
                    <span className="font-semibold text-[var(--foreground)] opacity-90">
                      {shippingMethodLabel(order.shippingMethod)}
                    </span>
                  </div>
                  {order.estimatedDelivery && (
                    <div>
                      <span className="text-[var(--foreground-muted)] text-[10px] uppercase font-bold block">
                        Est. Delivery
                      </span>
                      <span className="font-semibold text-[var(--foreground)] opacity-90">
                        {order.estimatedDelivery}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === "Delivered"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40"
                        : order.status === "Shipped"
                          ? "bg-[var(--accent)] dark:bg-[var(--accent)]/60 text-primary border border-[var(--accent)]/50 dark:border-[var(--accent)]/40"
                          : order.status === "Confirmed"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : order.status === "Processing"
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40"
                    }`}
                  >
                    {order.status}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadInvoice(order.orderNumber)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:bg-[var(--surface-alt)] text-xs font-semibold text-[var(--foreground)] transition-colors cursor-pointer h-8"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Invoice</span>
                  </Button>
                </div>
              </div>

              {/* Order Items List */}
              <div className="p-4 sm:p-5 space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)] last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-16 h-16 rounded-xl bg-[var(--surface-alt)] p-1.5 border border-[var(--border-color)] shrink-0 overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/shop/${item.slug}`}
                          className="text-xs sm:text-sm font-bold text-[var(--foreground)] hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                          Qty: {item.quantity} • {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {item.inStock === false && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                          Out of Stock
                        </span>
                      )}
                      <Button
                        size="sm"
                        isDisabled={loadingItemId === item.id}
                        onClick={() => handleBuyAgain(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer h-8 ${
                          item.inStock === false
                            ? "bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/80 dark:border-rose-900/40"
                            : "bg-[var(--surface-alt)] hover:bg-[var(--surface-alt)]/80 text-[var(--foreground)] border border-[var(--border-color)]"
                        }`}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${loadingItemId === item.id ? "animate-spin" : ""}`} />
                        <span>{loadingItemId === item.id ? "Adding..." : "Buy Again"}</span>
                      </Button>

                      {order.status === "Delivered" && (
                        <Link
                          href={`/shop/${item.slug}#reviews`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold transition-colors h-8 flex items-center"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Customer Delivery Response Banner (Available when Shipped) ── */}
              {((order.status === "Shipped" || (order as any).rawStatus === "shipped") || order.customerResponse) && (
                <div className="px-4 sm:px-5">
                  {!order.customerResponse ? (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
                          <PackageCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                              Shipment in Transit — Response Requested
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-white animate-pulse">
                              Action Required
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                            Please submit a response confirming whether you received your package, did not receive it, or want to cancel.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleOpenResponseModal(order)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 transition-all cursor-pointer self-start sm:self-auto h-9 shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Response</span>
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs ${
                        order.customerResponse === "received"
                          ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200"
                          : order.customerResponse === "not_received"
                          ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200"
                          : "bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            order.customerResponse === "received"
                              ? "bg-emerald-500 text-white"
                              : order.customerResponse === "not_received"
                              ? "bg-amber-500 text-white"
                              : "bg-rose-500 text-white"
                          }`}
                        >
                          {order.customerResponse === "received" && <CheckCircle2 className="w-4 h-4" />}
                          {order.customerResponse === "not_received" && <AlertTriangle className="w-4 h-4" />}
                          {order.customerResponse === "cancelled" && <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs">
                              Your Response:{" "}
                              {order.customerResponse === "received"
                                ? "Order Received"
                                : order.customerResponse === "not_received"
                                ? "Order Not Received"
                                : "Order Cancelled"}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--surface-elevated)]/70 dark:bg-[var(--surface)]/70 border border-current">
                              Admin Notified
                            </span>
                          </div>
                          {order.customerResponseNote && (
                            <p className="text-[11px] text-[var(--foreground-secondary)] dark:text-[var(--foreground-muted)] mt-0.5 italic">
                              "{order.customerResponseNote}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-[var(--foreground-muted)] flex items-center gap-2 self-end sm:self-auto">
                        {order.customerResponseAt && (
                          <span>
                            {new Date(order.customerResponseAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {(order.status === "Shipped" || (order as any).rawStatus === "shipped") && (
                          <button
                            onClick={() => handleOpenResponseModal(order)}
                            className="text-primary hover:underline font-semibold text-[11px] cursor-pointer ml-1"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Order Footer with Tracking CTA */}
              <div className="p-4 sm:p-5 pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--foreground-muted)]">
                <div>
                  <span>Paid with {order.paymentMethod}</span>
                  {order.trackingNumber && (
                    <span className="ml-2 font-mono text-[11px] text-primary">
                      • {order.carrier}: #{order.trackingNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {order.timeline && (
                    <Button
                      size="sm"
                      onClick={() => setTrackingModalOrder(order)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-colors cursor-pointer h-8 border border-primary/20"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Track Shipment</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Order Tracking Modal ── */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface)]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-[var(--foreground)]">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  Tracking: {trackingModalOrder.orderNumber}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {trackingModalOrder.carrier} • #{trackingModalOrder.trackingNumber}
                  </p>
                  {trackingModalOrder.trackingNumber && (
                    <button
                      onClick={() => copyTracking(trackingModalOrder.trackingNumber!)}
                      className="text-primary hover:underline cursor-pointer"
                      title="Copy Tracking #"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                isIconOnly
                variant="ghost"
                onClick={() => setTrackingModalOrder(null)}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-sm font-bold p-1 h-8 w-8 min-w-0"
              >
                ✕
              </Button>
            </div>

            {/* Shipping Method + Estimated Delivery */}
            <div className="flex flex-wrap items-center gap-2.5 -mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-alt)] border border-[var(--border-color)] text-[11px] font-bold text-[var(--foreground)]">
                <Truck className="w-3.5 h-3.5 text-primary" />
                {shippingMethodLabel(trackingModalOrder.shippingMethod)}
              </span>
              {trackingModalOrder.estimatedDelivery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-alt)] border border-[var(--border-color)] text-[11px] font-semibold text-[var(--foreground-secondary)]">
                  <Calendar className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                  Est. {trackingModalOrder.estimatedDelivery}
                </span>
              )}
            </div>

            {/* Timeline */}
            <div className="space-y-4 py-2">
              {trackingModalOrder.timeline.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start relative">
                  {idx !== trackingModalOrder.timeline.length - 1 && (
                    <div
                      className={`absolute left-3.5 top-7 w-0.5 h-10 ${
                        step.completed ? "bg-primary" : "bg-[var(--border-color)]"
                      }`}
                    />
                  )}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      step.completed
                        ? "bg-primary text-white shadow-xs"
                        : step.current
                          ? "bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950/60 animate-pulse"
                          : "bg-[var(--surface-alt)] text-[var(--foreground-muted)] border border-[var(--border-color)]"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[var(--foreground)]">
                        {step.title}
                      </p>
                      <span className="text-[10px] text-[var(--foreground-muted)] font-medium">
                        {step.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
              <div className="text-[var(--foreground-muted)]">
                <span>Shipping to: </span>
                <span className="font-semibold text-[var(--foreground)] block sm:inline">
                  {trackingModalOrder.shippingAddress}
                </span>
              </div>
              <Button
                onClick={() => setTrackingModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-all cursor-pointer shrink-0 h-9"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Order Delivery Response Modal ── */}
      {responseModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface)]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-[var(--foreground)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                  <span>Order Delivery Feedback</span>
                  <span className="text-xs font-mono text-primary">
                    {responseModalOrder.orderNumber}
                  </span>
                </h3>
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                  Let the store know if you received this package or have an issue.
                </p>
              </div>
              <Button
                size="sm"
                isIconOnly
                variant="ghost"
                onClick={() => setResponseModalOrder(null)}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)] dark:hover:text-[var(--foreground)] text-sm font-bold p-1 h-8 w-8 min-w-0"
              >
                ✕
              </Button>
            </div>

            {/* Response Options */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--foreground)] block">
                Select Your Delivery Status:
              </label>

              {/* Option 1: Received */}
              <div
                onClick={() => setSelectedResponse("received")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  selectedResponse === "received"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                    : "border-[var(--border-color)] dark:border-[var(--border-color)] hover:border-[var(--border-color)] dark:hover:border-[var(--border-color)] bg-[var(--surface-elevated)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedResponse === "received"
                      ? "bg-emerald-500 text-white"
                      : "bg-[var(--surface-alt)] text-[var(--foreground-muted)]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[var(--foreground)]">
                      Order Received
                    </p>
                    <input
                      type="radio"
                      name="orderResponse"
                      checked={selectedResponse === "received"}
                      onChange={() => setSelectedResponse("received")}
                      className="accent-emerald-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                    I have received my package safely with all items in good condition.
                  </p>
                </div>
              </div>

              {/* Option 2: Not Received */}
              <div
                onClick={() => setSelectedResponse("not_received")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  selectedResponse === "not_received"
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs"
                    : "border-[var(--border-color)] dark:border-[var(--border-color)] hover:border-[var(--border-color)] dark:hover:border-[var(--border-color)] bg-[var(--surface-elevated)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedResponse === "not_received"
                      ? "bg-amber-500 text-white"
                      : "bg-[var(--surface-alt)] text-[var(--foreground-muted)]"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[var(--foreground)]">
                      Order Not Received
                    </p>
                    <input
                      type="radio"
                      name="orderResponse"
                      checked={selectedResponse === "not_received"}
                      onChange={() => setSelectedResponse("not_received")}
                      className="accent-amber-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                    The shipment has not arrived yet, courier was unavailable, or delivery failed.
                  </p>
                </div>
              </div>

              {/* Option 3: Cancelled / Return */}
              <div
                onClick={() => setSelectedResponse("cancelled")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  selectedResponse === "cancelled"
                    ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs"
                    : "border-[var(--border-color)] dark:border-[var(--border-color)] hover:border-[var(--border-color)] dark:hover:border-[var(--border-color)] bg-[var(--surface-elevated)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedResponse === "cancelled"
                      ? "bg-rose-500 text-white"
                      : "bg-[var(--surface-alt)] text-[var(--foreground-muted)]"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[var(--foreground)]">
                      Cancel Order / Reject Delivery
                    </p>
                    <input
                      type="radio"
                      name="orderResponse"
                      checked={selectedResponse === "cancelled"}
                      onChange={() => setSelectedResponse("cancelled")}
                      className="accent-rose-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                    I want to reject the parcel, request return, or cancel this shipment.
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Note / Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--foreground)] flex items-center justify-between">
                <span>Notes or Details (Optional):</span>
                <span className="text-[10px] text-[var(--foreground-muted)] font-normal">Visible to store admin</span>
              </label>
              <textarea
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                rows={3}
                placeholder={
                  selectedResponse === "received"
                    ? "e.g., Everything arrived in perfect condition, thank you!"
                    : selectedResponse === "not_received"
                    ? "e.g., Courier contacted me earlier but didn't show up today..."
                    : "e.g., Need to cancel due to damaged box or wrong timing..."
                }
                className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)] text-xs text-[var(--foreground)] focus:outline-hidden focus:border-primary resize-none shadow-xs"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end gap-2.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setResponseModalOrder(null)}
                isDisabled={isSubmittingResponse}
                className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer h-9 text-[var(--foreground)] border-[var(--border-color)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitResponse}
                isDisabled={isSubmittingResponse}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/25 cursor-pointer h-9"
              >
                {isSubmittingResponse ? "Submitting..." : "Submit Response"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
    </>
  );
}
