"use client";

import { useSyncExternalStore } from "react";
import type { Product } from "@/types";

/**
 * Product comparison list.
 *
 * A comparison is a browsing aid, not account data, so it lives in the browser's
 * localStorage: it works for guests too, survives a page refresh, and needs no
 * backend endpoint. The list holds at most COMPARE_LIMIT products.
 *
 * The store is a tiny module-level state + `useSyncExternalStore`, so every
 * component that calls `useCompare()` re-renders when the list changes
 * (product cards, the navbar badge and the compare page itself).
 */

export const COMPARE_LIMIT = 3;
const STORAGE_KEY = "sparq_compare_products";

/** The product fields the compare table reads. */
export interface CompareProduct {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  categories: string[];
  inStock: boolean;
  /** null means the product is not stock-tracked. */
  stockQuantity?: number | null;
  rating?: number;
  reviewCount?: number;
  description?: string;
  sku?: string;
  warrantyPeriodMonths?: number;
  warrantyType?: string;
  specifications: Record<string, string>;
}

export type AddToCompareResult = "added" | "duplicate" | "full";

// ── The store ───────────────────────────────────────────────────────────────

let snapshot: CompareProduct[] = [];
let hasLoaded = false;
const listeners = new Set<() => void>();

/** Specifications arrive as a loose object; keep only simple string values. */
function cleanSpecifications(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: Record<string, string> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, raw]) => {
    if (raw === null || raw === undefined || raw === "") return;
    result[key] = String(raw);
  });
  return result;
}

/** Copies only what the compare page needs, to keep localStorage small. */
export function toCompareProduct(product: Product): CompareProduct {
  return {
    id: String(product.id || product._id || product.slug),
    slug: product.slug,
    title: product.title,
    image: product.image,
    price: Number(product.price) || 0,
    originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
    discountPercentage: product.discountPercentage,
    categories: Array.isArray(product.categories) ? product.categories : [],
    inStock: Boolean(product.inStock),
    stockQuantity: product.stockQuantity,
    rating: product.rating ? Number(product.rating) : 0,
    reviewCount: product.reviewCount ? Number(product.reviewCount) : 0,
    description: product.description,
    sku: product.sku,
    warrantyPeriodMonths: product.warrantyPeriodMonths,
    warrantyType: product.warrantyType,
    specifications: cleanSpecifications(product.specifications),
  };
}

function readStorage(): CompareProduct[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Guard against hand-edited or outdated entries.
    return parsed
      .filter((item) => item && item.id && item.slug)
      .slice(0, COMPARE_LIMIT)
      .map((item) => ({ ...item, specifications: cleanSpecifications(item.specifications) }));
  } catch {
    return [];
  }
}

function persist(items: CompareProduct[]): void {
  snapshot = items;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can be blocked (private mode); the in-memory list still works.
  }

  listeners.forEach((listener) => listener());
}

// ── Public store API ────────────────────────────────────────────────────────

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCompareSnapshot(): CompareProduct[] {
  if (!hasLoaded) {
    snapshot = readStorage();
    hasLoaded = true;
  }
  return snapshot;
}

/** The server has no localStorage, so it always renders an empty list. */
const EMPTY: CompareProduct[] = [];
export function getCompareServerSnapshot(): CompareProduct[] {
  return EMPTY;
}

export function addToCompare(product: Product): AddToCompareResult {
  const items = getCompareSnapshot();
  const item = toCompareProduct(product);

  if (items.some((existing) => existing.id === item.id)) return "duplicate";
  if (items.length >= COMPARE_LIMIT) return "full";

  persist([...items, item]);
  return "added";
}

export function removeFromCompare(id: string): void {
  persist(getCompareSnapshot().filter((item) => item.id !== id));
}

export function clearCompare(): void {
  persist([]);
}

// ── React hook ──────────────────────────────────────────────────────────────

export function useCompare() {
  const items = useSyncExternalStore(subscribe, getCompareSnapshot, getCompareServerSnapshot);

  return {
    items,
    count: items.length,
    isFull: items.length >= COMPARE_LIMIT,
    has: (id: string) => items.some((item) => item.id === String(id)),
    add: addToCompare,
    remove: removeFromCompare,
    clear: clearCompare,
  };
}
