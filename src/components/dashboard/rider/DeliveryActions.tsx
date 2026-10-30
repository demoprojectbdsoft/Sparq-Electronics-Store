"use client";

import React, { useState } from "react";
import { Button, Modal } from "@heroui/react";
import {
  ArrowRight,
  Ban,
  Check,
  KeyRound,
  Loader2,
  PackageCheck,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  acceptDeliveryAction,
  advanceDeliveryAction,
  declineDeliveryAction,
} from "@/lib/action/deliveries";
import { isActiveDelivery, nextRiderStep } from "@/lib/rider";
import CompleteDeliveryDialog from "./CompleteDeliveryDialog";
import type { DeliveryRecord } from "@/types/delivery";

/**
 * Everything a rider can do to one job.
 *
 * The buttons only offer the move the lifecycle allows, and the server checks
 * the same rule again: a double tap, or a tap a second after the offer expired,
 * cannot skip a stage.
 */

interface DeliveryActionsProps {
  delivery: DeliveryRecord;
  /** An offer whose answer window has closed: it may only be read. */
  expired?: boolean;
  /** Row-sized buttons instead of the detail view's full-width pair. */
  compact?: boolean;
  /** Called after the server accepted a change, so the page can refresh. */
  onChanged?: () => void;
}

export default function DeliveryActions({
  delivery,
  expired = false,
  compact = false,
  onChanged,
}: DeliveryActionsProps) {
  const [busy, setBusy] = useState<string>("");
  const [reasonFor, setReasonFor] = useState<"decline" | "cancel" | null>(null);
  const [reason, setReason] = useState("");
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  const sizeClass = compact ? "h-8 px-2.5 text-[10px]" : "h-10 px-4 text-xs";

  const run = async (
    key: string,
    action: () => Promise<{ success?: boolean; message?: string } | undefined>,
    success: string
  ) => {
    setBusy(key);
    try {
      const res = await action();
      if (res?.success === false) {
        toast.error(res?.message || "That did not go through");
        return false;
      }
      toast.success(success);
      onChanged?.();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That did not go through");
      return false;
    } finally {
      setBusy("");
    }
  };

  const handleAccept = () =>
    run("accept", () => acceptDeliveryAction(delivery._id), "Accepted. Head to the store.");

  const handleAdvance = (status: "picked_up" | "out_for_delivery") =>
    run(
      status,
      () => advanceDeliveryAction(delivery._id, status),
      status === "picked_up" ? "Marked picked up" : "On the way to the customer"
    );

  const handleReason = async () => {
    if (!reasonFor) return;
    const text = reason.trim();
    if (reasonFor === "decline" && text.length < 3) {
      toast.error("Please tell the store why you cannot take this delivery");
      return;
    }

    const ok = await run(
      reasonFor,
      () =>
        reasonFor === "decline"
          ? declineDeliveryAction(delivery._id, text)
          : advanceDeliveryAction(delivery._id, "cancelled", text || undefined),
      reasonFor === "decline" ? "Declined. The store was told." : "Delivery cancelled"
    );

    if (ok) {
      setReasonFor(null);
      setReason("");
    }
  };

  // ── A new offer ──
  if (delivery.status === "assigned") {
    if (expired) {
      return (
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
          Window closed
        </span>
      );
    }

    return (
      <div className={`flex items-center gap-1.5 ${compact ? "" : "w-full"}`}>
        <Button
          size="sm"
          onPress={handleAccept}
          isDisabled={busy !== ""}
          className={`${sizeClass} rounded-xl bg-brand-gradient text-[var(--on-grad-text)] font-bold shadow-xs disabled:opacity-50`}
        >
          {busy === "accept" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              Accept
            </>
          )}
        </Button>
        <Button
          size="sm"
          onPress={() => {
            setReason("");
            setReasonFor("decline");
          }}
          isDisabled={busy !== ""}
          className={`${sizeClass} rounded-xl bg-[var(--surface-alt)] border border-[var(--border-color)] text-[var(--foreground)] font-bold`}
        >
          <X className="w-3.5 h-3.5" />
          Decline
        </Button>

        <ReasonDialog
          isOpen={reasonFor === "decline"}
          onOpenChange={(open) => !open && setReasonFor(null)}
          title={`Decline ${delivery.orderNumber}?`}
          description="The store sees your reason and offers the job to another rider. Be specific: a vague reason cannot be fixed."
          placeholder="Too far, vehicle in service, already at capacity…"
          confirmLabel="Decline job"
          isBusy={busy === "decline"}
          value={reason}
          onChange={setReason}
          onConfirm={handleReason}
        />
      </div>
    );
  }

  // ── A job in hand ──
  if (isActiveDelivery(delivery.status)) {
    const step = nextRiderStep(delivery.status);
    const canComplete = delivery.status === "out_for_delivery";

    return (
      <div className={`flex items-center gap-1.5 ${compact ? "" : "w-full flex-wrap"}`}>
        {step && (
          <Button
            size="sm"
            onPress={() => handleAdvance(step.status as "picked_up" | "out_for_delivery")}
            isDisabled={busy !== ""}
            className={`${sizeClass} rounded-xl bg-brand-gradient text-[var(--on-grad-text)] font-bold shadow-xs disabled:opacity-50`}
          >
            {busy === step.status ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <PackageCheck className="w-3.5 h-3.5" />
                {step.label}
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </Button>
        )}

        {canComplete && (
          <Button
            size="sm"
            onPress={() => setIsCompleteOpen(true)}
            className={`${sizeClass} rounded-xl bg-emerald-600 text-white font-bold shadow-xs`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Deliver with code
          </Button>
        )}

        <Button
          size="sm"
          onPress={() => {
            setReason("");
            setReasonFor("cancel");
          }}
          isDisabled={busy !== ""}
          className={`${sizeClass} rounded-xl bg-[var(--surface-alt)] border border-[var(--border-color)] text-rose-600 dark:text-rose-400 font-bold`}
        >
          <Ban className="w-3.5 h-3.5" />
          Cancel
        </Button>

        <ReasonDialog
          isOpen={reasonFor === "cancel"}
          onOpenChange={(open) => !open && setReasonFor(null)}
          title={`Cancel ${delivery.orderNumber}?`}
          description="The store and the customer are both told. The order itself stays as it is, so the store can send another rider."
          placeholder="Customer unreachable, address wrong, parcel refused…"
          confirmLabel="Cancel delivery"
          isBusy={busy === "cancel"}
          value={reason}
          onChange={setReason}
          onConfirm={handleReason}
        />

        <CompleteDeliveryDialog
          isOpen={isCompleteOpen}
          onOpenChange={setIsCompleteOpen}
          delivery={delivery}
          onCompleted={onChanged}
        />
      </div>
    );
  }

  return null;
}

interface ReasonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder: string;
  confirmLabel: string;
  isBusy: boolean;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
}

/** One dialog for both ways a rider can stop a job: decline and cancel. */
function ReasonDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  placeholder,
  confirmLabel,
  isBusy,
  value,
  onChange,
  onConfirm,
}: ReasonDialogProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-4 text-[var(--foreground)]">
            <Modal.Header className="space-y-1">
              <Modal.Heading className="text-base font-extrabold text-[var(--foreground)]">
                {title}
              </Modal.Heading>
              <p className="text-[11px] text-[var(--foreground-muted)]">{description}</p>
            </Modal.Header>

            <Modal.Body>
              <textarea
                autoFocus
                rows={3}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-xs bg-[var(--surface-alt)] border border-[var(--border-color)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-flat)]/30 resize-none"
              />
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                onPress={() => onOpenChange(false)}
                className="h-9 px-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-color)] text-[var(--foreground)] text-[11px] font-bold"
              >
                Keep it
              </Button>
              <Button
                size="sm"
                onPress={onConfirm}
                isDisabled={isBusy}
                className="h-9 px-4 rounded-xl bg-rose-600 text-white text-[11px] font-bold disabled:opacity-60"
              >
                {isBusy ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending
                  </span>
                ) : (
                  confirmLabel
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
