"use client";

import React, { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Input, Button, Modal } from "@heroui/react";
import {
  Mail,
  Search,
  RotateCcw,
  Trash2,
  Eye,
  X,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Reply,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { deleteMessage } from "@/lib/action/message";

/** The shape the backend returns for one stored contact message. */
interface MessageItem {
  _id: string;
  name: string;
  email: string;
  department: string;
  subject: string;
  body: string;
  sentTo: string;
  status: "sent" | "failed";
  error: string;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminMessagesClientProps {
  initialMessages: MessageItem[];
  pagination: PaginationMeta;
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "sent", label: "Emailed" },
  { key: "failed", label: "Not emailed" },
];

/** "Oct 30, 2026" — one place, so every date in the table reads the same. */
function formatDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminMessagesClient({
  initialMessages = [],
  pagination,
}: AdminMessagesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Rows deleted in this visit. The list itself always comes from the server,
  // so a new filter or a refresh needs no extra syncing.
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const visibleMessages = (Array.isArray(initialMessages) ? initialMessages : []).filter(
    (item) => !removedIds.includes(item._id)
  );
  const [selected, setSelected] = useState<MessageItem | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [toDelete, setToDelete] = useState<MessageItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentStatus = searchParams.get("status") || "all";
  const currentSearch = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(currentSearch);

  /** Rewrites the URL, which makes the server component fetch the new page. */
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") params.delete(key);
        else params.set(key, value);
      });

      // Any filter change starts again from page 1, unless the page was asked for.
      if (!("page" in updates)) params.delete("page");

      const qs = params.toString();
      startTransition(() => {
        router.push(`/dashboard/admin/messages${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateParams({ search: searchInput.trim() });
  };

  const handleReset = () => {
    setSearchInput("");
    startTransition(() => {
      router.push("/dashboard/admin/messages", { scroll: false });
    });
  };

  const openMessage = (item: MessageItem) => {
    setSelected(item);
    setIsViewOpen(true);
  };

  const promptDelete = (item: MessageItem) => {
    setToDelete(item);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;

    setIsDeleting(true);
    try {
      const res = await deleteMessage(toDelete._id);
      if (res?.success !== false) {
        toast.success("Message deleted");
        setRemovedIds((prev) => [...prev, toDelete._id]);
        setIsDeleteOpen(false);
        setToDelete(null);
        if (selected?._id === toDelete._id) {
          setIsViewOpen(false);
          setSelected(null);
        }
        router.refresh();
      } else {
        toast.error(res?.message || "Could not delete the message");
      }
    } catch {
      toast.error("Could not delete the message");
    } finally {
      setIsDeleting(false);
    }
  };

  const { page, limit, total, totalPages } = pagination || {
    page: 1,
    limit: 10,
    total: visibleMessages.length,
    totalPages: 1,
  };
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);
  const hasFilters = Boolean(currentSearch) || currentStatus !== "all";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] mb-1">
            <Link href="/dashboard/admin" className="hover:text-primary transition-colors">
              Admin Dashboard
            </Link>
            <span>/</span>
            <span className="text-primary">Messages</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Contact <span className="text-primary">Messages</span>
          </h1>
          <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1">
            Every message written on the contact page. Replying is done from your mailbox —
            the email copy carries the visitor as the reply-to address.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary self-start sm:self-auto">
          Total Messages: <span className="font-extrabold">{total}</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-[var(--border-color)]">
          <span className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mr-1">
            Delivery:
          </span>
          {STATUS_TABS.map((tab) => {
            const isActive = currentStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => updateParams({ status: tab.key === "all" ? undefined : tab.key })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-xs font-bold"
                    : "bg-[var(--surface-alt)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border-color)]"
                }`}
              >
                {tab.label}
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
                placeholder="Search by name, email or subject..."
                className="w-full pl-9 pr-4 h-10 bg-[var(--surface-alt)] border border-[var(--border-color)] rounded-xl text-xs"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs cursor-pointer shrink-0"
            >
              Search
            </Button>
          </form>

          {hasFilters && (
            <Button
              size="sm"
              onPress={handleReset}
              className="h-10 px-3 rounded-xl bg-[var(--surface-alt)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-xs font-semibold cursor-pointer flex items-center gap-1 self-end sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      {isPending ? (
        <Card className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-[var(--foreground-muted)]">Loading messages...</p>
        </Card>
      ) : visibleMessages.length === 0 ? (
        <Card className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--foreground)]">No messages yet</h3>
            <p className="text-xs text-[var(--foreground-muted)]">
              {hasFilters
                ? "Nothing matched these filters."
                : "Messages sent through the contact page will appear here."}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--surface-alt)]/80 text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                  <th className="py-3.5 px-4">From</th>
                  <th className="py-3.5 px-4">Message</th>
                  <th className="py-3.5 px-4">Delivery</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60 text-xs">
                {visibleMessages.map((item) => (
                  <tr
                    key={item._id}
                    onClick={() => openMessage(item)}
                    className="hover:bg-[var(--surface-alt)]/70 transition-colors cursor-pointer"
                  >
                    {/* Sender */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[var(--foreground)] truncate max-w-[160px]">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-[var(--foreground-muted)] truncate max-w-[160px]">
                        {item.email}
                      </p>
                    </td>

                    {/* Subject + preview */}
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--surface-alt)] text-[var(--foreground-muted)]">
                          {item.department === "contact" ? "General" : "Support"}
                        </span>
                        <p className="font-semibold text-[var(--foreground)] truncate">
                          {item.subject || "(no subject)"}
                        </p>
                      </div>
                      <p className="text-[var(--foreground-muted)] truncate mt-0.5">{item.body}</p>
                    </td>

                    {/* Did the email copy go out? */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === "sent" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Emailed
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400"
                          title={item.error}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Not emailed
                        </span>
                      )}
                      {item.status === "sent" && item.sentTo && (
                        <p className="text-[10px] text-[var(--foreground-muted)] truncate max-w-[140px]">
                          {item.sentTo}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-[var(--foreground-muted)] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.createdAt)}
                      </span>
                    </td>

                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => openMessage(item)}
                          className="w-8 h-8 rounded-lg text-[var(--foreground-muted)] hover:text-primary hover:bg-primary/10 cursor-pointer"
                          aria-label="Read message"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => promptDelete(item)}
                          className="w-8 h-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                          aria-label="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Footer ── */}
          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--surface-alt)]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[var(--foreground-muted)]">
              Showing{" "}
              <span className="font-bold text-[var(--foreground)]">
                {startItem}–{endItem}
              </span>{" "}
              of <span className="font-bold text-[var(--foreground)]">{total}</span> messages
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={page <= 1}
                  onPress={() => updateParams({ page: String(page - 1) })}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Previous
                </Button>
                <span className="text-xs font-bold px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={page >= totalPages}
                  onPress={() => updateParams({ page: String(page + 1) })}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════
          MESSAGE DETAILS MODAL
      ════════════════════════════════════════════════════════ */}
      <Modal isOpen={isViewOpen} onOpenChange={setIsViewOpen}>
        <Modal.Backdrop
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsViewOpen(false);
          }}
        >
          <Modal.Container size="md">
            <Modal.Dialog className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-[var(--foreground)]">
              {selected && (
                <>
                  <Modal.Header className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <Modal.Heading className="text-base font-bold truncate">
                          {selected.subject || "(no subject)"}
                        </Modal.Heading>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {formatDate(selected.createdAt)} ·{" "}
                          {selected.department === "contact" ? "General & Business" : "Support"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsViewOpen(false)}
                      aria-label="Close"
                      className="p-1.5 rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </Modal.Header>

                  <Modal.Body className="space-y-4">
                    {/* Who wrote it */}
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-alt)]">
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{selected.name}</p>
                        <a
                          href={`mailto:${selected.email}`}
                          className="text-[11px] text-primary hover:underline truncate block"
                        >
                          {selected.email}
                        </a>
                      </div>
                    </div>

                    {/* The message itself */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold">Message</p>
                      <div className="p-4 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border-color)]/70 text-xs leading-relaxed whitespace-pre-wrap">
                        {selected.body}
                      </div>
                    </div>

                    {/* Delivery state */}
                    <div className="p-3 rounded-xl bg-[var(--surface-alt)] text-[11px] space-y-1">
                      <p className="flex items-center gap-1.5 font-bold">
                        {selected.status === "sent" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Email copy sent to {selected.sentTo}
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            Email copy was not sent
                          </>
                        )}
                      </p>
                      {selected.status !== "sent" && selected.error && (
                        <p className="text-[var(--foreground-muted)]">{selected.error}</p>
                      )}
                    </div>
                  </Modal.Body>

                  <Modal.Footer className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--border-color)]">
                    <Button
                      size="sm"
                      variant="danger-soft"
                      onPress={() => promptDelete(selected)}
                      isDisabled={isDeleting}
                      className="px-3.5 h-9 rounded-xl font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </Button>

                    <a
                      href={`mailto:${selected.email}?subject=${encodeURIComponent(
                        `Re: ${selected.subject || "Your message"}`
                      )}`}
                      className="px-4 h-9 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply by email</span>
                    </a>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* ════════════════════════════════════════════════════════
          DELETE CONFIRMATION
      ════════════════════════════════════════════════════════ */}
      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Modal.Backdrop
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDeleteOpen(false);
          }}
        >
          <Modal.Container size="sm">
            <Modal.Dialog className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-4 text-[var(--foreground)]">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-base font-extrabold">Delete this message?</h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                  It will be removed from the dashboard for good. The email copy in your
                  mailbox is not affected.
                </p>
                {toDelete && (
                  <div className="p-3 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border-color)]/70 text-left mt-2">
                    <p className="text-xs font-bold truncate">{toDelete.name}</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] truncate">
                      {toDelete.subject || "(no subject)"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <Button
                  onPress={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--surface-alt)] text-[var(--foreground)] font-bold text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleConfirmDelete}
                  isDisabled={isDeleting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? "Deleting..." : "Yes, delete"}</span>
                </Button>
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
