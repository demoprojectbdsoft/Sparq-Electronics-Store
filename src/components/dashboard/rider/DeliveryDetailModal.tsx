"use client";

import React from "react";
import Link from "next/link";
import { Button, Chip, Modal } from "@heroui/react";
import {
  Building2,
  Clock,
  History,
  MapPin,
  Navigation,
  Package,
  Phone,
  User as UserIcon,
  X,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_STYLES,
  formatDistance,
  formatMoment,
  isActiveDelivery,
} from "@/lib/rider";
import { useRiderLocation } from "@/hooks/useRiderLocation";
import DeliveryActions from "./DeliveryActions";
import type { DeliveryRecord } from "@/types/delivery";

/**
 * One job, in full.
 *
 * The rider sees everything needed at the door — who, where, what, and how much
 * — plus the only two things the app asks of them: move the job forward, and
 * share where they are while they carry it.
 */

interface DeliveryDetailModalProps {
  delivery: DeliveryRecord | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expired?: boolean;
  onChanged?: () => void;
}

export default function DeliveryDetailModal({
  delivery,
  isOpen,
  onOpenChange,
  expired = false,
  onChanged,
}: DeliveryDetailModalProps) {
  const { formatPrice } = useSiteSettings();
  const active = delivery ? isActiveDelivery(delivery.status) : false;
  const { isSharing, error, lastSentAt, points, toggle } = useRiderLocation(
    active && delivery ? delivery._id : null
  );

  const handleChanged = () => {
    onChanged?.();
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="lg">
          <Modal.Dialog className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-[var(--foreground)]">
            {delivery && (
              <>
                <Modal.Header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[var(--border-color)] pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Modal.Heading className="text-base font-extrabold text-[var(--foreground)]">
                        {delivery.orderNumber}
                      </Modal.Heading>
                      <Chip
                        size="sm"
                        className={`border text-[10px] font-bold ${DELIVERY_STATUS_STYLES[delivery.status]}`}
                      >
                        {DELIVERY_STATUS_LABELS[delivery.status]}
                      </Chip>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                      Assigned {formatMoment(delivery.createdAt)}
                      {delivery.distanceKm ? ` · ${formatDistance(delivery.distanceKm)}` : ""}
                    </p>
                  </div>
                  <Modal.CloseTrigger className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer p-1 rounded-lg self-end sm:self-auto">
                    ✕
                  </Modal.CloseTrigger>
                </Modal.Header>

                <Modal.Body className="space-y-4">
                  {/* The answer window, while there is one. */}
                  {delivery.status === "assigned" && delivery.expiresAt && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                      <Clock className="w-4 h-4 shrink-0" />
                      {expired
                        ? "This request expired before you answered it."
                        : `Answer before ${formatMoment(delivery.expiresAt)}`}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border-color)] space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                        Collect from
                      </p>
                      <p className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                        Sparq store
                      </p>
                      <p className="text-[11px] text-[var(--foreground-muted)]">
                        {delivery.items} item{delivery.items === 1 ? "" : "s"} ·{" "}
                        {formatPrice(delivery.orderTotal)} order
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border-color)] space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                        Deliver to
                      </p>
                      <p className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                        {delivery.customerName || "Customer"}
                      </p>
                      {delivery.customerPhone && (
                        <a
                          href={`tel:${delivery.customerPhone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
                        >
                          <Phone className="w-3 h-3" />
                          {delivery.customerPhone}
                        </a>
                      )}
                      <p className="text-[11px] text-[var(--foreground-muted)] flex items-start gap-1">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                        {[delivery.address, delivery.city].filter(Boolean).join(", ") ||
                          "No address recorded"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                      Your fee
                    </span>
                    <span className="text-lg font-extrabold text-[var(--foreground)]">
                      {formatPrice(delivery.fee)}
                    </span>
                  </div>

                  {/* Position sharing, only while carrying. */}
                  {active && (
                    <div className="p-3.5 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border-color)] space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <Navigation
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              isSharing ? "text-emerald-500" : "text-[var(--foreground-muted)]"
                            }`}
                          />
                          <div>
                            <p className="text-[11px] font-bold text-[var(--foreground)]">
                              Share my live location
                            </p>
                            <p className="text-[10px] text-[var(--foreground-muted)]">
                              {isSharing
                                ? lastSentAt
                                  ? `Sending every 15s · ${points} update${points === 1 ? "" : "s"} sent`
                                  : "Waiting for the first position…"
                                : "The customer sees where you are on their tracking page"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onPress={toggle}
                          className={`h-8 px-3 rounded-xl text-[10px] font-bold shrink-0 ${
                            isSharing
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                              : "bg-[var(--surface-elevated)] text-[var(--foreground)] border border-[var(--border-color)]"
                          }`}
                        >
                          {isSharing ? "Stop" : "Start"}
                        </Button>
                      </div>
                      {error && (
                        <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <X className="w-3 h-3" />
                          {error}
                        </p>
                      )}
                    </div>
                  )}

                  {/* History */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      History
                    </p>
                    {delivery.history.length === 0 ? (
                      <p className="text-[11px] text-[var(--foreground-muted)]">
                        Nothing has moved yet.
                      </p>
                    ) : (
                      <ol className="space-y-2">
                        {delivery.history.map((event, index) => (
                          <li key={`${event.status}-${index}`} className="flex items-start gap-2.5 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-flat)] mt-1.5 shrink-0" />
                            <div>
                              <p className="font-bold text-[var(--foreground)]">
                                {DELIVERY_STATUS_LABELS[event.status]}
                                <span className="font-medium text-[var(--foreground-muted)]">
                                  {" "}
                                  · {formatMoment(event.at)}
                                </span>
                              </p>
                              {event.note && (
                                <p className="text-[var(--foreground-muted)]">{event.note}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {delivery.declineReason && (
                    <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-[11px] text-rose-900 dark:text-rose-200">
                      <span className="font-bold">Reason on record: </span>
                      {delivery.declineReason}
                    </div>
                  )}
                </Modal.Body>

                <Modal.Footer className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[var(--border-color)]">
                  <Link
                    href="/dashboard/rider/deliveries"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary"
                  >
                    <Package className="w-3.5 h-3.5" />
                    All my deliveries
                  </Link>

                  <DeliveryActions
                    delivery={delivery}
                    expired={expired}
                    onChanged={handleChanged}
                  />
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
