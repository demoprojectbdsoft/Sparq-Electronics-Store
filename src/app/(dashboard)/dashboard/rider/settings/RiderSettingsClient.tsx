"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@heroui/react";
import {
  Bell,
  KeyRound,
  LogOut,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "react-toastify";
import { authClient } from "@/lib/auth-client";
import { updateUser } from "@/lib/action/user";

interface RiderSettingsClientProps {
  riderId: string;
  riderName: string;
  email: string;
  availability: "online" | "offline";
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-color)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--brand-flat)] transition-colors";

export default function RiderSettingsClient({
  riderId,
  riderName,
  email,
  availability: initialAvailability,
}: RiderSettingsClientProps) {
  const router = useRouter();

  const [availability, setAvailability] = useState(initialAvailability);
  const [isToggling, setIsToggling] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleAvailability = async (next: "online" | "offline") => {
    if (next === availability || isToggling) return;

    const previous = availability;
    setAvailability(next);
    setIsToggling(true);

    try {
      const res = await updateUser(riderId, { availability: next });
      if (res?.success === false) {
        setAvailability(previous);
        toast.error(res?.message || "Could not change your availability.");
        return;
      }
      toast.success(next === "online" ? "You are online." : "You are offline — no new requests.");
      router.refresh();
    } catch {
      setAvailability(previous);
      toast.error("Could not change your availability.");
    } finally {
      setIsToggling(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("The new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("The new passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        toast.error(error.message || "Could not update your password.");
        return;
      }

      toast.success("Password updated. Other sessions were signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Could not update your password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/auth/login");
    } catch {
      toast.error("Could not sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Rider <span className="text-gradient-primary">Settings</span>
        </h1>
        <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1">
          Availability, password and account controls for {riderName}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Availability ── */}
        <Card className="bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">Availability</h3>
              <p className="text-xs text-[var(--foreground-muted)]">
                Offline riders are not offered new jobs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isToggling}
              onClick={() => handleAvailability("online")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                availability === "online"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-[var(--surface-alt)] text-[var(--foreground-muted)] border-[var(--border-color)]"
              }`}
            >
              <Wifi className="w-4 h-4" />
              Online
            </button>
            <button
              type="button"
              disabled={isToggling}
              onClick={() => handleAvailability("offline")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                availability === "offline"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  : "bg-[var(--surface-alt)] text-[var(--foreground-muted)] border-[var(--border-color)]"
              }`}
            >
              <WifiOff className="w-4 h-4" />
              Offline
            </button>
          </div>

          <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
            Jobs you have already accepted stay yours until delivered, even while offline.
          </p>

          <div className="pt-4 border-t border-[var(--border-color)] flex items-start gap-2">
            <Bell className="w-3.5 h-3.5 text-[var(--foreground-muted)] mt-0.5" />
            <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
              Delivery updates go to <span className="font-bold text-[var(--foreground)]">{email}</span>.
              Everything that needs your attention is listed in{" "}
              <Link
                href="/dashboard/rider/notifications"
                className="font-bold text-primary hover:underline"
              >
                Notifications
              </Link>
              .
            </p>
          </div>
        </Card>

        {/* ── Password ── */}
        <Card className="bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">Password</h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Changing it signs out every other device.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--foreground)]">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--foreground)]">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--foreground)]">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat the new password"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="flex items-center gap-1.5 text-[10px] text-[var(--foreground-muted)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secured by your account
              </p>
              <Button
                type="submit"
                isDisabled={isChangingPassword}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold h-9 px-4 rounded-xl cursor-pointer"
              >
                {isChangingPassword ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Session ── */}
        <Card className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">Session</h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Sign out of this device when you finish your shift.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSignOut}
              isDisabled={isSigningOut}
              className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-xs font-bold h-9 px-4 rounded-xl cursor-pointer"
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
