"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  Input,
  Button,
  Select,
  ListBox,
  Modal,
  Chip,
  TextArea,
} from "@heroui/react";
import {
  Shield,
  Search,
  RotateCcw,
  Eye,
  Calendar,
  ShoppingBag,
  X,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminUpdateClaim } from "@/lib/action/warranty";
import ImageGalleryModal from "@/components/shared/ImageGalleryModal";
import type { NormalizedAdminWarranty } from "@/types";

const STATUS_FILTER_TABS = ["All", "Active", "Claim Submitted", "Under Review", "Info Requested", "Resolved", "Expired"];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "expiry_near", label: "Expiry (Soonest)" },
];

type WarrantyItem = NormalizedAdminWarranty;

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminWarrantiesClientProps {
  initialWarranties: WarrantyItem[];
  pagination: PaginationMeta;
}

export default function AdminWarrantiesClient({
  initialWarranties = [],
  pagination,
}: AdminWarrantiesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [warranties, setWarranties] = useState<WarrantyItem[]>(initialWarranties);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action state
  const [adminNote, setAdminNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [currentAction, setCurrentAction] = useState<string>("");

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    setWarranties(Array.isArray(initialWarranties) ? initialWarranties : []);
  }, [initialWarranties]);

  const currentStatusParam = searchParams.get("status") || "All";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined || val === "" || (key === "status" && val.toLowerCase() === "all")) {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      });

      if (!("page" in updates)) {
        params.delete("page");
      }

      const qs = params.toString();
      startTransition(() => {
        router.push(`/dashboard/admin/warranties${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateParams({ search: searchInput.trim() });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.push("/dashboard/admin/warranties", { scroll: false });
    });
  };

  const openWarrantyModal = (warranty: WarrantyItem) => {
    setSelectedWarranty(warranty);
    setAdminNote(warranty.claimAdminNote || "");
    setResolution(warranty.resolutionDetails || "");
    setIsModalOpen(true);
  };

  const handleAdminAction = async (action: "mark_under_review" | "request_info" | "resolve" | "reject") => {
    if (!selectedWarranty) return;

    if ((action === "resolve" || action === "reject") && !resolution.trim() && !adminNote.trim()) {
      toast.warning("Please provide resolution details or an admin note.");
      return;
    }

    if (action === "request_info" && !adminNote.trim()) {
      toast.warning("Please provide a note explaining what info is needed.");
      return;
    }

    setIsSubmitting(true);
    setCurrentAction(action);
    try {
      const res = await adminUpdateClaim(selectedWarranty.id, {
        action,
        adminNote: adminNote.trim() || undefined,
        resolution: resolution.trim() || undefined,
      });

      if (res?.success !== false) {
        toast.success(`Warranty updated: ${action.replace(/_/g, " ")}`);
        const updated = res.data ?? res;

        setWarranties((prev) =>
          prev.map((w) => (w.id === selectedWarranty.id ? { ...w, ...updated } : w))
        );
        setSelectedWarranty((prev) => (prev ? { ...prev, ...updated } : null));

        if (action === "resolve" || action === "reject") {
          setIsModalOpen(false);
        }
        router.refresh();
      } else {
        toast.error(res?.message || "Failed to update warranty");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
      setCurrentAction("");
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case "active":
        return <Chip size="sm" variant="soft"  className="font-bold uppercase text-[10px]">Active</Chip>;
      case "expired":
        return <Chip size="sm" variant="soft" color="default" className="font-bold uppercase text-[10px]">Expired</Chip>;
      case "claim_submitted":
        return <Chip size="sm" variant="soft" color="warning" className="font-bold uppercase text-[10px]">Claimed</Chip>;
      case "under_review":
        return <Chip size="sm" variant="soft" color="accent" className="font-bold uppercase text-[10px]">Review</Chip>;
      case "info_requested":
        return <Chip size="sm" variant="soft" color="warning" className="font-bold uppercase text-[10px]">Needs Info</Chip>;
      case "resolved":
        return <Chip size="sm" variant="soft"  className="font-bold uppercase text-[10px]">Resolved</Chip>;
      default:
        return <Chip size="sm" variant="soft" color="default" className="font-bold uppercase text-[10px]">{status}</Chip>;
    }
  };

  const { page, limit, total, totalPages } = pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] mb-1">
            <Link href="/dashboard/admin" className="hover:text-primary transition-colors">Admin Dashboard</Link>
            <span>/</span>
            <span className="text-primary">Warranties</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Warranty <span className="text-primary">Claims</span>
          </h1>
          <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1">
            Manage product warranty records and process customer claims.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
          Total Records: <span className="font-extrabold">{total}</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-[var(--border-color)]/80">
          <span className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mr-1">Status:</span>
          {STATUS_FILTER_TABS.map((tab) => {
            const rawStatus = tab === "All" ? "All" : tab.toLowerCase().replace(/ /g, "_");
            const isActive = currentStatusParam === rawStatus;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => updateParams({ status: rawStatus === "all" ? undefined : rawStatus })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive ? "bg-primary text-white shadow-xs font-bold" : "bg-[var(--surface-alt)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border-color)]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] z-10" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by ID, product, or email..."
                className="w-full pl-9 h-10 bg-[var(--surface-alt)] border border-[var(--border-color)] rounded-xl text-xs"
              />
            </div>
            <Button type="submit" size="sm" className="h-10 px-4 rounded-xl bg-primary text-white font-bold text-xs">Search</Button>
          </form>

          <div className="flex items-center gap-2">
            <div className="w-48">
              <Select
                aria-label="Sort"
                selectedKey={currentSort}
                onSelectionChange={(key) => updateParams({ sort: String(key) })}
              >
                <Select.Trigger className="h-10 w-full px-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)] text-xs font-semibold flex items-center justify-between">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="w-52 p-1.5 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-xl shadow-xl">
                  <ListBox>
                    {SORT_OPTIONS.map((opt) => (
                      <ListBox.Item key={opt.key} id={opt.key} textValue={opt.label} className="text-xs font-medium px-3 py-2 rounded-lg hover:bg-primary/10">
                        {opt.label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            {(currentSearch || currentStatusParam !== "All") && (
              <Button size="sm" onPress={handleResetFilters} className="h-10 px-3 rounded-xl bg-[var(--surface-alt)] text-xs font-semibold">
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      {isPending ? (
        <Card className="p-12 text-center border border-[var(--border-color)]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-xs font-semibold text-[var(--foreground-muted)]">Loading records...</p>
        </Card>
      ) : warranties.length === 0 ? (
        <Card className="p-12 text-center border border-[var(--border-color)]">
          <Shield className="w-12 h-12 mx-auto text-[var(--foreground-muted)] mb-4 opacity-20" />
          <h3 className="text-base font-bold">No records found</h3>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">Try adjusting your filters or search terms.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-[var(--border-color)] p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-alt)] border-b border-[var(--border-color)] text-[var(--foreground-muted)] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Warranty ID</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Expiry</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {warranties.map((w) => (
                  <tr key={w.id} className="hover:bg-[var(--surface-alt)]/50 cursor-pointer transition-colors" onClick={() => openWarrantyModal(w)}>
                    <td className="py-3 px-4 font-mono font-bold text-[var(--foreground-muted)]">#{w.id.slice(-6).toUpperCase()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 max-w-[180px]">
                        <div className="w-8 h-8 rounded bg-[var(--surface-alt)] border border-[var(--border-color)] shrink-0 overflow-hidden flex items-center justify-center p-1">
                          {w.productImage ? <img src={w.productImage} className="object-contain" alt="" /> : <ShoppingBag className="w-4 h-4 text-[var(--foreground-muted)]" />}
                        </div>
                        <span className="font-bold truncate">{w.productTitle || "Product"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold">{w.userName || "Customer"}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">{w.userEmail}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[var(--foreground-muted)]" />
                        {new Date(w.expiryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusChip(w.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <Button isIconOnly size="sm" variant="ghost" className="h-8 w-8 rounded-lg" onPress={() => openWarrantyModal(w)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-[var(--surface-alt)]/30 border-t border-[var(--border-color)] flex items-center justify-between">
             <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">
              Showing {startItem}-{endItem} of {total}
            </p>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <Button size="sm" isDisabled={page <= 1} onPress={() => updateParams({ page: String(page - 1) })}>Prev</Button>
                <Button size="sm" isDisabled={page >= totalPages} onPress={() => updateParams({ page: String(page + 1) })}>Next</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Detail Modal ── */}
      <Modal isOpen={isModalOpen && !isGalleryOpen} onOpenChange={setIsModalOpen}>
        <Modal.Backdrop onClick={() => setIsModalOpen(false)}>
          <Modal.Container size="lg">
            <Modal.Dialog className="bg-[var(--surface-elevated)] rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              {selectedWarranty && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-primary/10 text-primary"><Shield className="w-5 h-5" /></div>
                      <div>
                        <h2 className="text-lg font-bold">Warranty Details</h2>
                        <p className="text-[10px] font-mono font-bold text-[var(--foreground-muted)] uppercase">Record: {selectedWarranty.id}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--surface-alt)] rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border-color)]/60">
                      <p className="text-[10px] font-bold uppercase text-[var(--foreground-muted)] mb-2">Customer & Order</p>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">{(selectedWarranty.userName || "C").charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{selectedWarranty.userName}</p>
                          <p className="text-[10px] text-[var(--foreground-muted)] truncate">{selectedWarranty.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--foreground-muted)]">Order:</span>
                        <span className="font-bold text-primary">#{selectedWarranty.orderId.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border-color)]/60">
                      <p className="text-[10px] font-bold uppercase text-[var(--foreground-muted)] mb-2">Product & Status</p>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[var(--border-color)] flex items-center justify-center p-1 shrink-0">
                          {selectedWarranty.productImage ? <img src={selectedWarranty.productImage} className="object-contain" alt="" /> : <ShoppingBag className="w-4 h-4 text-slate-300" />}
                        </div>
                        <p className="text-xs font-bold truncate">{selectedWarranty.productTitle}</p>
                      </div>
                      <div className="flex items-center justify-between">{getStatusChip(selectedWarranty.status)}</div>
                    </div>
                  </div>

                  {selectedWarranty.claimReason && (
                    <div className="space-y-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <h3 className="text-sm font-bold">Customer Claim Information</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-amber-600/60 dark:text-amber-400/60">Reason</p>
                          <p className="text-xs font-bold mt-0.5">{selectedWarranty.claimReason}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-amber-600/60 dark:text-amber-400/60">Description</p>
                          <p className="text-xs leading-relaxed mt-1">{selectedWarranty.claimDescription}</p>
                        </div>
                        {selectedWarranty.claimImages && selectedWarranty.claimImages.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase text-amber-600/60 dark:text-amber-400/60 mb-2">Images ({selectedWarranty.claimImages.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedWarranty.claimImages.map((img: string, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setGalleryImages(selectedWarranty.claimImages!);
                                    setGalleryIndex(idx);
                                    setIsGalleryOpen(true);
                                  }}
                                  className="w-14 h-14 rounded-lg overflow-hidden border border-amber-500/20 hover:border-amber-500/50 transition-all"
                                >
                                  <img src={img} className="w-full h-full object-cover" alt="" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 border-t border-[var(--border-color)] pt-6">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> Admin Actions
                    </h3>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--foreground)]">Internal Admin Note</label>
                        <TextArea
                          placeholder="Private notes for staff..."
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          className="bg-[var(--surface-alt)]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--foreground)]">Resolution Details</label>
                        <TextArea
                          placeholder="Visible to the customer upon resolution/rejection..."
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          className="bg-[var(--surface-alt)]"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                        <Button
                          size="sm"
                          
                          variant={selectedWarranty.status === "under_review" ? "primary" : "ghost"}
                          onPress={() => handleAdminAction("mark_under_review")}
                          isDisabled={isSubmitting}
                          className="font-bold text-[10px] uppercase h-9"
                        >
                          {currentAction === "mark_under_review" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Review"}
                        </Button>
                        <Button
                          size="sm"
                          
                          variant={selectedWarranty.status === "info_requested" ? "secondary" : "ghost"}
                          onPress={() => handleAdminAction("request_info")}
                          isDisabled={isSubmitting}
                          className="font-bold text-[10px] uppercase h-9"
                        >
                           {currentAction === "request_info" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ask Info"}
                        </Button>
                        <Button
                          size="sm"
                          
                          onPress={() => handleAdminAction("resolve")}
                          isDisabled={isSubmitting}
                          className="font-bold text-[10px] uppercase h-9 text-white"
                        >
                           {currentAction === "resolve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Resolve"}
                        </Button>
                        <Button
                          size="sm"
                          
                          onPress={() => handleAdminAction("reject")}
                          isDisabled={isSubmitting}
                          className="font-bold text-[10px] uppercase h-9"
                        >
                           {currentAction === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Reject"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={galleryImages}
        initialIndex={galleryIndex}
        productTitle="Claim Evidence"
      />
    </div>
  );
}
