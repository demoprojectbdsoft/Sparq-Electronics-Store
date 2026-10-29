"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  ArrowLeftRight,
  X,
} from "lucide-react";
import { getCartByUserId } from "@/lib/api/cart";
import { getWishlistByUserId } from "@/lib/api/wishlist";
import { useCompare } from "@/lib/compare";
import { authClient } from "@/lib/auth-client";

export default function MobileFloatingActions() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  // The compare list lives in the browser, so it reports its own live count.
  const { count: compareCount } = useCompare();

  // ── Sync Live Counts ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }

    const loadCounts = () => {
      // 1. Cart
      getCartByUserId(user.id)
        .then((res) => {
          if (res?.success && res.data) {
            setCartCount(res.data.totalItems ?? res.data.itemCount ?? 0);
          }
        })
        .catch(() => {});

      // 2. Wishlist
      getWishlistByUserId(user.id)
        .then((res) => {
          if (res?.success && res.data) {
            const total =
              res.data.totalItems ??
              res.data.itemCount ??
              (Array.isArray(res.data) ? res.data.length : res.data.items?.length || 0);
            setWishlistCount(total);
          }
        })
        .catch(() => {});
    };

    loadCounts();

    window.addEventListener("cart-updated", loadCounts);
    window.addEventListener("wishlist-updated", loadCounts);

    return () => {
      window.removeEventListener("cart-updated", loadCounts);
      window.removeEventListener("wishlist-updated", loadCounts);
    };
  }, [user?.id]);

  const totalActionsCount = cartCount + wishlistCount + compareCount;

  const wishlistHref = user
    ? "/dashboard/customer/wishlist"
    : "/auth/login?callbackUrl=/dashboard/customer/wishlist";
  const cartHref = user ? "/cart" : "/auth/login?callbackUrl=/cart";
  const compareHref = "/compare";

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Dimmed Backdrop when menu is open */}
      {isOpen && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden transition-opacity duration-200"
        />
      )}

      {/* Floating Action Menu Container */}
      <div className="fixed bottom-[72px] right-4 sm:right-6 z-50 md:hidden flex flex-col items-end pointer-events-none">
        
        {/* Expanded Floating Items */}
        <div
          className={`flex flex-col items-end gap-3 mb-3 transition-all duration-300 ease-out origin-bottom-right ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-90 translate-y-6 pointer-events-none"
          }`}
        >
          {/* 1. Compare Button */}
          <Link
            href={compareHref}
            onClick={closeMenu}
            className="flex items-center gap-2.5 group"
          >
            <span className="px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)]/95 text-[var(--foreground)] text-xs font-bold shadow-lg border border-[var(--border-color)] backdrop-blur-md transition-transform group-active:scale-95">
              Compare
            </span>
            <div className="relative w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-[var(--surface-elevated)] transition-transform group-hover:scale-105 active:scale-95">
              <ArrowLeftRight className="w-5 h-5 stroke-[2]" />
              {compareCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-[var(--surface-elevated)] dark:border-[var(--surface-alt)]">
                  {compareCount > 99 ? "99+" : compareCount}
                </span>
              )}
            </div>
          </Link>

          {/* 2. Wishlist Button */}
          <Link
            href={wishlistHref}
            onClick={closeMenu}
            className="flex items-center gap-2.5 group"
          >
            <span className="px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)]/95 text-[var(--foreground)] text-xs font-bold shadow-lg border border-[var(--border-color)] backdrop-blur-md transition-transform group-active:scale-95">
              Wishlist
            </span>
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-[var(--surface-elevated)] transition-transform group-hover:scale-105 active:scale-95">
              <Heart className="w-5 h-5 stroke-[2] fill-white/20" />
              {Boolean(user) && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-[var(--foreground)] text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-[var(--surface-elevated)] dark:border-[var(--surface-alt)]">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </div>
          </Link>

          {/* 3. Cart Button */}
          <Link
            href={cartHref}
            onClick={closeMenu}
            className="flex items-center gap-2.5 group"
          >
            <span className="px-3 py-1.5 rounded-xl bg-[var(--surface-elevated)]/95 text-[var(--foreground)] text-xs font-bold shadow-lg border border-[var(--border-color)] backdrop-blur-md transition-transform group-active:scale-95">
              Cart
            </span>
            <div className="relative w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-[var(--surface-elevated)] transition-transform group-hover:scale-105 active:scale-95">
              <ShoppingCart className="w-5 h-5 stroke-[2]" />
              {Boolean(user) && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-[var(--surface-elevated)] dark:border-[var(--surface-alt)] animate-pulse">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Main Floating Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Close quick actions" : "Open shopping quick actions"}
          aria-expanded={isOpen}
          className="pointer-events-auto relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-xl shadow-primary/40 border-2 border-[var(--surface-elevated)] transition-all duration-300 transform active:scale-90 hover:scale-105 cursor-pointer focus:outline-none"
        >
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-6 h-6 stroke-[2.5] transition-transform duration-300 rotate-90" />
            ) : (
              <ShoppingBag className="w-6 h-6 stroke-[2.2] transition-transform duration-200" />
            )}
          </div>

          {/* Combined count badge when collapsed */}
          {!isOpen && Boolean(user) && totalActionsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-md border-2 border-[var(--surface-elevated)] dark:border-[var(--surface-alt)] leading-none">
              {totalActionsCount > 99 ? "99+" : totalActionsCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
