"use client";

import React, { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { completeDeliveryAction } from "@/lib/action/deliveries";
import type { DeliveryRecord } from "@/types/delivery";

/**
 * The hand-over, proven.
 *
 * A rider cannot close a job on their own word: the customer reads six digits
 * off their tracking page, and those digits are what marks the order delivered.
 * The code is checked on the server, so nothing here decides anything.
 */

interface CompleteDeliveryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: DeliveryRecord | null;
  onCompleted?: () => void;
}

export default function CompleteDeliveryDialog({
  isOpen,
  onOpenChange,
  delivery,
  onCompleted,
}: CompleteDeliveryDialogProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCode("");
    setError("");
  }, [isOpen, delivery?._id]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!delivery) return;

    const value = code.trim();
    if (!/^\d{4,6}$/.test(value)) {
      setError("Enter the 6-digit code the customer read to you");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const res = await completeDeliveryAction(delivery._id, value);
      if (res?.success === false) {
        setError(res?.message || "That code did not work");
        return;
      }
      toast.success("Delivered. The order is closed.");
      onCompleted?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The delivery could not be closed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-5 text-[var(--foreground)]">
            <Modal.Header className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[var(--brand-flat)]/10 text-[var(--brand-flat)] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <Modal.CloseTrigger className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer p-1 rounded-lg">
                  ✕
                </Modal.CloseTrigger>
              </div>
              <Modal.Heading className="text-base font-extrabold text-[var(--foreground)]">
                Close {delivery?.orderNumber ?? "this delivery"} with the customer&apos;s code
              </Modal.Heading>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                The customer opens their tracking page and reads out the six digits. The code
                expires after 30 minutes; they can generate a new one without calling you back.
              </p>
            </Modal.Header>

            <Modal.Body className="space-y-3">
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.6em] text-2xl font-extrabold py-3 bg-[var(--surface-alt)] border border-[var(--border-color)] rounded-2xl text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-flat)]/30 focus:border-[var(--brand-flat)]"
                />

                {error && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 text-center">
                    {error}
                  </p>
                )}

                <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-color)]">
                  <ShieldCheck className="w-4 h-4 text-[var(--foreground-muted)] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[var(--foreground-muted)] leading-relaxed">
                    A correct code marks the order delivered, settles the payment and credits any
                    reward points. It cannot be undone.
                  </p>
                </div>
              </form>
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                onPress={() => onOpenChange(false)}
                className="h-9 px-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-color)] text-[var(--foreground)] text-[11px] font-bold"
              >
                Not yet
              </Button>
              <Button
                size="sm"
                onPress={() => handleSubmit()}
                isDisabled={isSubmitting || code.length < 4}
                className="h-9 px-4 rounded-xl bg-brand-gradient text-[var(--on-grad-text)] text-[11px] font-bold disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Checking
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm delivery
                  </span>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
