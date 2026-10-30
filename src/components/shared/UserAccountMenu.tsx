"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  Loader2,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-toastify";
import UserAvatar from "./UserAvatar";

export default function UserAccountMenu() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const userRole = ((user as { role?: string })?.role || "customer").toLowerCase();
  const userImage = user?.image || (user as { avatar?: string })?.avatar;
  const firstName = user?.name ? user.name.split(" ")[0] : "Account";

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await authClient.signOut();
      setIsOpen(false);
      toast.success("Logged out successfully");
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAdminOrDemo = userRole === "admin" || userRole === "demoadmin";
  const isRider = userRole === "rider";
  const profileHref = isRider ? `/dashboard/rider/profile` : `/dashboard/profile`;
  const dashboardHref = isAdminOrDemo
    ? `/dashboard/admin`
    : isRider
      ? `/dashboard/rider`
      : `/dashboard/${userRole}`;
  const settingsHref = isRider ? `/dashboard/rider/settings` : `/dashboard/settings`;
  const ordersHref = isAdminOrDemo
    ? "/dashboard/admin/orders"
    : isRider
      ? "/dashboard/rider/deliveries"
      : "/dashboard/customer/orders";
  const ordersLabel = isRider ? "Deliveries" : "Orders";

  // Loading state placeholder
  if (isPending) {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--surface-alt)] dark:bg-[var(--surface)] animate-pulse shrink-0" />
    );
  }

  // Not logged in -> Clean Sign In Button
  if (!user) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/auth/login"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--foreground-secondary)] dark:text-[var(--foreground)] hover:text-primary dark:hover:text-primary hover:bg-[var(--surface-alt)] transition-all cursor-pointer"
        >
          <User className="w-4 h-4 text-[var(--foreground-muted)]" />
          <span>Sign In</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Dropdown Toggle Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="User Account Menu"
        className={`flex items-center gap-2.5 p-1 pl-1 pr-2.5 rounded-full border transition-all duration-200 cursor-pointer select-none group ${
          isOpen
            ? "border-primary/50 bg-primary/10 shadow-xs"
            : "border-[var(--border-color)] hover:border-primary/40 bg-[var(--surface-elevated)]"
        }`}
      >
        {/* Avatar badge — the photo when it loads, the initial when it cannot */}
        <UserAvatar
          src={userImage}
          name={user.name || "User"}
          size={28}
          className="rounded-full bg-primary text-white text-xs shadow-xs"
        />

        {/* Name & Role preview */}
        <div className="text-left hidden lg:block leading-tight">
          <p className="text-xs font-bold text-[var(--foreground)] truncate max-w-[90px]">
            {firstName}
          </p>
          <p className="text-[10px] text-[var(--foreground-muted)] capitalize">
            {userRole}
          </p>
        </div>

        {/* Chevron Icon */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-[var(--surface-elevated)] rounded-2xl shadow-xl border border-[var(--border-color)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden"
          role="menu"
        >
          {/* Header section with User info */}
          <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--surface-alt)]">
            <div className="flex items-center gap-3">
              <UserAvatar
                src={userImage}
                name={user.name || "User"}
                size={40}
                className="rounded-full bg-primary text-white text-sm shadow-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--foreground)] truncate">
                  {user.name || "User"}
                </p>
                <p className="text-[11px] text-[var(--foreground-muted)] truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-primary" />
                {userRole}
              </span>
            </div>
          </div>

          {/* Navigation items */}
          <div className="py-1.5 px-1.5 space-y-0.5 text-xs font-medium text-[var(--foreground)]">
            {/* Profile */}
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--surface-alt)] hover:text-primary transition-colors"
            >
              <User className="w-4 h-4 text-[var(--foreground-muted)]" />
              <span>Profile</span>
            </Link>

            {/* Dashboard */}
            <Link
              href={dashboardHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--surface-alt)] hover:text-primary transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[var(--foreground-muted)]" />
              <span>Dashboard</span>
            </Link>

            {/* Orders / Deliveries */}
            <Link
              href={ordersHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--surface-alt)] hover:text-primary transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-[var(--foreground-muted)]" />
              <span>{ordersLabel}</span>
            </Link>

            {/* Settings */}
            <Link
              href={settingsHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--surface-alt)] hover:text-primary transition-colors"
            >
              <Settings className="w-4 h-4 text-[var(--foreground-muted)]" />
              <span>Settings</span>
            </Link>
          </div>

          {/* Logout button */}
          <div className="p-1.5 border-t border-[var(--border-color)]/80">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <LogOut className="w-4 h-4 shrink-0" />
              )}
              <span>{isLoggingOut ? "Signing out..." : "Log Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
