"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@heroui/react";
import { ProductsGridProps, Product } from "@/types";
import ProductCard from "@/components/shared/ProductCard";
import ProductCardSkeleton from "@/components/shared/ProductCardSkeleton";
import { getProducts } from "@/lib/api/products";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  PackageOpen,
  FileDigit,
  Infinity as InfinityIcon,
  Loader2,
  ArrowUp,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function ProductsGrid({ products, pagination }: ProductsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { settings: siteSettings } = useSiteSettings();

  const { page, limit, total, totalPages } = pagination;

  // ── Mode State: "pagination" | "scroll" ──────────────────────────────────────
  const [mode, setMode] = useState<"pagination" | "scroll">("pagination");

  // Read initial preference: URL param -> Customer preference -> Admin Site Settings
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "scroll" || urlMode === "pagination") {
      setMode(urlMode);
    } else {
      const customerPreference = localStorage.getItem("sparq_customer_browse_mode");
      const savedMode = localStorage.getItem("sparq_shop_mode");
      if (customerPreference && customerPreference !== "default") {
        setMode(customerPreference as "pagination" | "scroll");
      } else if (savedMode === "scroll" || savedMode === "pagination") {
        setMode(savedMode);
      } else if (siteSettings?.shopBrowseMode) {
        setMode(siteSettings.shopBrowseMode);
      }
    }
  }, [searchParams, siteSettings?.shopBrowseMode]);

  // Handle switching mode
  const handleModeChange = (newMode: "pagination" | "scroll") => {
    if (newMode === mode) return;
    setMode(newMode);
    try {
      localStorage.setItem("sparq_shop_mode", newMode);
    } catch {
      // ignore
    }
    const params = new URLSearchParams(searchParams.toString());
    if (newMode === "scroll") {
      params.set("mode", "scroll");
      params.delete("page"); // infinite scroll starts from page 1
    } else {
      params.delete("mode");
    }
    startTransition(() => {
      router.replace(`/shop?${params.toString()}`, { scroll: false });
    });
  };

  // ── Infinite Scroll State ────────────────────────────────────────────────────
  const [infiniteProducts, setInfiniteProducts] = useState<Product[]>(products);
  const [infinitePage, setInfinitePage] = useState<number>(page || 1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(page < totalPages);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Sync infiniteProducts when the parent products change (filters, category, sort, search)
  useEffect(() => {
    setInfiniteProducts(products);
    setInfinitePage(page || 1);
    setHasMore((page || 1) < totalPages);
  }, [products, totalPages, page]);

  // Load more products for infinite scroll
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = infinitePage + 1;

    try {
      const queryObj: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        if (key !== "page" && key !== "mode") queryObj[key] = val;
      });
      queryObj.page = String(nextPage);
      const res = await getProducts(queryObj);
      const incoming: Product[] = res?.data?.products || [];
      const newTotalPages: number = res?.data?.pagination?.totalPages ?? totalPages;

      setInfiniteProducts((prev) => {
        const existingIds = new Set(
          prev.map((p) => p.id || (p as any)._id || p.slug)
        );
        const uniqueIncoming = incoming.filter(
          (p) => !existingIds.has(p.id || (p as any)._id || p.slug)
        );
        return [...prev, ...uniqueIncoming];
      });

      setInfinitePage(nextPage);
      setHasMore(nextPage < newTotalPages);
    } catch (err) {
      console.error("Failed to load more products:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, infinitePage, searchParams, limit, totalPages]);

  // IntersectionObserver for auto-scrolling
  useEffect(() => {
    if (mode !== "scroll" || !hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { root: null, rootMargin: "350px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mode, hasMore, isLoadingMore, loadMore]);

  // ── Pagination Navigation ───────────────────────────────────────────────────
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    startTransition(() =>
      router.push(`/shop?${params.toString()}`, { scroll: false })
    );
  };

  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    pages.push(1);
    if (page > 3) pages.push("ellipsis");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  // ── Empty State ─────────────────────────────────────────────────────────────
  if (products.length === 0 && (!infiniteProducts || infiniteProducts.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border-color)] text-center min-h-[350px]">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <PackageOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
          No products found
        </h3>
        <p className="text-xs text-[var(--foreground-muted)] max-w-sm mb-6">
          Try adjusting your filters or search query.
        </p>
        <button
          type="button"
          onClick={() => router.push("/shop")}
          className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  // Active products to display depending on current mode
  const displayedProducts = mode === "scroll" ? infiniteProducts : products;
  const progressPercent =
    total > 0
      ? Math.min(100, Math.round((displayedProducts.length / total) * 100))
      : 100;

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* ── Top Toolbar: Feed Info + Mode Toggle Switch ── */}
      <div className="w-full flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-2.5 sm:px-4 bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border-color)] shadow-xs">
        {/* Left: Product count & live feed status */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {mode === "pagination" ? (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-[var(--foreground-muted)] truncate">
              <span className="truncate">
                Showing{" "}
                <span className="font-bold text-[var(--foreground)]">
                  {startItem}–{endItem}
                </span>{" "}
                of <span className="font-bold text-primary">{total}</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-alt)] border border-[var(--border-color)] text-[var(--foreground-muted)] shrink-0">
                Page {page}/{totalPages}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] truncate">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="truncate">
                  Loaded{" "}
                  <span className="font-bold text-[var(--foreground)]">
                    {displayedProducts.length}
                  </span>{" "}
                  of <span className="font-bold text-primary">{total}</span> items
                </span>
              </span>

              {/* Progress bar: Always visible in Infinite Scroll mode */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-12 sm:w-20 h-2 rounded-full bg-[var(--surface-alt)] overflow-hidden border border-[var(--border-color)] shadow-2xs">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-400 transition-all duration-300 min-w-[4px]"
                    style={{ width: `${Math.max(4, progressPercent)}%` }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-extrabold text-primary tabular-nums">
                  {progressPercent}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Browse Mode Toggle Segmented Control (Always aligned and vertically centered) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-[var(--foreground-muted)] hidden lg:inline">
            Browse Mode:
          </span>
          <div className="inline-flex items-center p-0.5 sm:p-1 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-color)] shadow-xs">
            <button
              type="button"
              onClick={() => handleModeChange("pagination")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer touch-manipulation whitespace-nowrap ${
                mode === "pagination"
                  ? "bg-primary text-white shadow-xs"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
              title="Show numbered pages navigation"
            >
              <FileDigit className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Pagination</span>
              <span className="sm:hidden">Pages</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("scroll")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer touch-manipulation whitespace-nowrap ${
                mode === "scroll"
                  ? "bg-primary text-white shadow-xs"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
              title="Continuously load products while scrolling"
            >
              <InfinityIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Infinite Scroll</span>
              <span className="sm:hidden">Scroll</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Products Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px bg-[var(--border-color)] rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-xs">
        {mode === "pagination" && isPending
          ? Array.from({ length: limit }).map((_, idx) => (
              <div
                key={`skel-${idx}`}
                className="bg-[var(--surface-elevated)] h-full"
              >
                <ProductCardSkeleton hasRightBorder={false} />
              </div>
            ))
          : displayedProducts.map((product) => (
              <div
                key={product.id || (product as any)._id}
                className="bg-[var(--surface-elevated)] h-full"
              >
                <ProductCard product={product} hasRightBorder={false} />
              </div>
            ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODE A: PAGINATION CONTROLS
      ══════════════════════════════════════════════════════════════ */}
      {mode === "pagination" && totalPages > 1 && (
        <div className="flex justify-center pt-2 pb-6">
          <Pagination className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-[var(--foreground-muted)]">
            <Pagination.Summary className="text-xs">
              Showing{" "}
              <span className="text-[var(--foreground)] font-bold">
                {startItem}–{endItem}
              </span>{" "}
              of <span className="text-primary font-bold">{total}</span> products
            </Pagination.Summary>

            <Pagination.Content className="flex items-center gap-1">
              {/* Previous button */}
              <Pagination.Item>
                <Pagination.Previous
                  className="flex items-center gap-1 px-3 h-8 rounded-lg text-xs hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  isDisabled={page === 1 || isPending}
                  onPress={() => goToPage(page - 1)}
                >
                  <Pagination.PreviousIcon />
                  <span>Prev</span>
                </Pagination.Previous>
              </Pagination.Item>

              {/* Page number links */}
              {getPageNumbers().map((p, i) =>
                p === "ellipsis" ? (
                  <Pagination.Item key={`ellipsis-${i}`}>
                    <Pagination.Ellipsis className="px-2 text-[var(--foreground-muted)] select-none text-xs" />
                  </Pagination.Item>
                ) : (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === page}
                      isDisabled={isPending}
                      onPress={() => goToPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        p === page
                          ? "bg-primary text-white shadow-sm shadow-primary/30"
                          : "hover:bg-primary/10 hover:text-primary text-[var(--foreground-muted)]"
                      }`}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                )
              )}

              {/* Next button */}
              <Pagination.Item>
                <Pagination.Next
                  className="flex items-center gap-1 px-3 h-8 rounded-lg text-xs hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  isDisabled={page === totalPages || isPending}
                  onPress={() => goToPage(page + 1)}
                >
                  <span>Next</span>
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODE B: INFINITE SCROLL LOADER & END-OF-FEED
      ══════════════════════════════════════════════════════════════ */}
      {mode === "scroll" && (
        <div className="pt-2 pb-8">
          {/* Skeletons while fetching next batch */}
          {isLoadingMore && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px bg-[var(--border-color)] rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-xs mb-4">
                {Array.from({ length: Math.min(4, limit || 4) }).map((_, idx) => (
                  <div
                    key={`scroll-skel-${idx}`}
                    className="bg-[var(--surface-elevated)] h-full"
                  >
                    <ProductCardSkeleton hasRightBorder={false} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-[var(--foreground-muted)]">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading more products...</span>
              </div>
            </div>
          )}

          {/* Observer Sentinel Element */}
          {hasMore && !isLoadingMore && (
            <div
              ref={sentinelRef}
              className="w-full py-4 flex flex-col items-center justify-center text-center"
            >
              <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span>Scroll down to load more products...</span>
              </div>
              {/* Optional Manual Fallback Button */}
              <button
                type="button"
                onClick={loadMore}
                className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-elevated)] hover:bg-[var(--surface-alt)] text-[var(--foreground)] border border-[var(--border-color)] transition-all cursor-pointer shadow-xs"
              >
                Load Next Page
              </button>
            </div>
          )}

          {/* End of Feed Card */}
          {!hasMore && displayedProducts.length > 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border-color)] text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[var(--foreground)]">
                You've viewed all {total} products
              </h4>
              <p className="text-xs text-[var(--foreground-muted)] max-w-sm mt-1">
                You have reached the end of the catalog for the current filters.
              </p>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-all cursor-pointer shadow-sm shadow-primary/20 hover:scale-105"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                Back to top
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
