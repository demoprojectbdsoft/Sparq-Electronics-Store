"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { toast } from "react-toastify";
import { markAllNotificationsRead } from "@/lib/action/notifications";

/** Clears every unread dot on this page's feed, for every signed-in device. */
export default function MarkAllNotificationsButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const onClick = async () => {
    setIsSaving(true);
    try {
      const res = await markAllNotificationsRead();
      if (res?.success === false) {
        toast.error(res?.message || "Could not mark the notifications as read");
        return;
      }
      toast.success("All notifications marked as read");
      // The list is rendered on the server, so it has to be asked again.
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error((err as Error).message || "Could not mark the notifications as read");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSaving || isPending}
      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] px-3.5 py-2 text-xs font-bold text-[var(--foreground)] hover:border-[var(--brand-flat)]/50 hover:text-[var(--brand-flat)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
    >
      <CheckCheck className="w-3.5 h-3.5" />
      {isSaving || isPending ? "Marking..." : "Mark all as read"}
    </button>
  );
}
