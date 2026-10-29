"use client";

import React, { useState } from "react";
import {
  Card,
  Button,
  Modal,
  Input,
  TextArea,
  Chip
} from "@heroui/react";
import {
  ShieldCheck,
  Calendar,
  ImagePlus,
  X,
  Loader2,
  Send,
  ShoppingBag
} from "lucide-react";
import { toast } from "react-toastify";
import { submitWarrantyClaim } from "@/lib/action/warranty";
import type { NormalizedWarranty } from "@/types";

type WarrantyRecord = NormalizedWarranty;

interface CustomerWarrantyClientProps {
  initialWarranties: WarrantyRecord[];
}

export default function CustomerWarrantyClient({ initialWarranties }: CustomerWarrantyClientProps) {
  const [warranties, setWarranties] = useState<WarrantyRecord[]>(initialWarranties);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRecord | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Claim Form State
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY ?? "";

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 5) {
      toast.warning("Maximum 5 images per claim.");
      return;
    }

    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append("image", file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: "POST",
          body,
        });
        const data = await res.json();
        if (data.success) uploaded.push(data.data.url as string);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch {
      toast.error("Failed to upload image(s).");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedWarranty || !reason.trim() || !description.trim()) {
      toast.warning("Please provide a reason and description for your claim.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitWarrantyClaim(selectedWarranty.id, {
        reason: reason.trim(),
        description: description.trim(),
        images,
      });

      if (res?.success !== false) {
        toast.success("Warranty claim submitted successfully!");
        setIsClaimModalOpen(false);
        setReason("");
        setDescription("");
        setImages([]);
        // Refresh local state
        setWarranties((prev) =>
          prev.map(w => w.id === selectedWarranty.id ? { ...w, status: "claim_submitted" } : w)
        );
      } else {
        toast.error(res?.message || "Failed to submit claim.");
      }
    } catch {
      toast.error("Failed to submit claim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string): "default" | "success" | "danger" | "accent" | "warning" | undefined => {
    switch (status) {
      case "active": return "success";
      case "claim_submitted": return "warning";
      case "under_review": return "accent";
      case "info_requested": return "warning";
      case "resolved": return "success";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            My <span className="bg-gradient-to-r from-primary to-[var(--brand-flat)] bg-clip-text text-transparent">Warranties</span>
          </h1>
          <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1">
            View and manage your product warranty protection.
          </p>
        </div>
      </div>

      {warranties.length === 0 ? (
        <Card className="p-12 text-center border border-[var(--border-color)] bg-[var(--surface-elevated)] shadow-xs">
           <ShieldCheck className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 p-3" />
           <h3 className="text-base font-bold text-[var(--foreground)]">No active warranties</h3>
           <p className="text-xs text-[var(--foreground-muted)] mt-1 max-w-xs mx-auto">
             Warranties are automatically activated when your orders are delivered.
           </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {warranties.map((w) => (
            <Card key={w.id} className="p-5 border border-[var(--border-color)] bg-[var(--surface-elevated)] shadow-xs">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-color)] flex items-center justify-center shrink-0 overflow-hidden">
                  {w.product?.image ? (
                    <img src={w.product.image} className="w-full h-full object-contain p-1" alt={w.product?.title || "Product"} />
                  ) : (
                    <ShoppingBag className="text-[var(--foreground-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-[var(--foreground)]">{w.product?.title || "Product"}</p>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-muted)] font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Expires: {new Date(w.expiryDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <Chip
                      size="sm"
                      color={getStatusColor(w.status)}
                      variant="soft"
                      className="capitalize text-[10px] font-bold px-2"
                    >
                      {w.status.replace(/_/g, " ")}
                    </Chip>
                    {w.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        onPress={() => {
                          setSelectedWarranty(w);
                          setIsClaimModalOpen(true);
                        }}
                      >
                        File Claim
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Claim Modal */}
      <Modal isOpen={isClaimModalOpen} onOpenChange={setIsClaimModalOpen}>
        <Modal.Backdrop onClick={() => setIsClaimModalOpen(false)}>
          <Modal.Container size="md">
            <Modal.Dialog className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <div className="flex items-center gap-2.5 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                  <h2 className="text-lg font-bold">Submit Warranty Claim</h2>
                </div>
                <button onClick={() => setIsClaimModalOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Claim Reason</label>
                  <Input
                    placeholder="e.g. Battery defect, Screen flicker..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-[var(--surface-alt)]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Description</label>
                  <TextArea
                    placeholder="Please describe the issue in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-[var(--surface-alt)]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                      <ImagePlus className="w-4 h-4 text-primary" />
                      Evidence Photos
                    </p>
                    <span className="text-[10px] font-bold text-[var(--foreground-muted)]">{images.length}/5</span>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-[var(--surface-alt)] rounded-2xl border border-dashed border-[var(--border-color)]">
                    {images.map((img, i) => (
                      <div key={i} className="w-16 h-16 relative bg-white border border-[var(--border-color)] rounded-xl overflow-hidden group">
                        <img src={img} className="w-full h-full object-cover" alt={`Evidence ${i+1}`} />
                        <button
                          onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className={`w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-color)]/60 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <ImagePlus className="w-5 h-5 text-[var(--foreground-muted)]" />}
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <Button
                  variant="ghost"
                  onPress={() => setIsClaimModalOpen(false)}
                  className="px-6 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleSubmitClaim}
                  isDisabled={isSubmitting || isUploading || !reason.trim() || !description.trim()}
                  className="px-8 font-bold text-xs rounded-xl bg-primary text-white shadow-lg shadow-primary/20 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                  Submit Claim
                </Button>
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
