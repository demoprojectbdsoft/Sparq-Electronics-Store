import type { DeliveryDestination } from "@/types/delivery";

/**
 * Puts a shipping address on the map.
 *
 * OpenStreetMap's Nominatim is free and needs no key, which is the whole reason
 * the tracking map has no bill attached. It is also a volunteer service, so the
 * two courtesies matter: one request per address, answered from Next's data
 * cache for a day afterwards, and a User-Agent that says who is calling.
 *
 * When the lookup fails the page still works — the map simply shows the rider
 * and the address stays as text — so every error path returns null.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const CACHE_SECONDS = 60 * 60 * 24;

interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeAddress(
  address: string,
  city?: string
): Promise<DeliveryDestination | null> {
  const query = [address, city].filter((part) => Boolean(part && part.trim())).join(", ").trim();
  if (!query) return null;

  try {
    const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SparqStore/1.0 (order tracking)",
      },
      next: { revalidate: CACHE_SECONDS },
    });

    if (!res.ok) return null;

    const hits = (await res.json()) as NominatimHit[];
    const hit = hits?.[0];
    if (!hit) return null;

    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng, label: hit.display_name };
  } catch (error) {
    console.error("geocodeAddress failed for", query, ":", (error as Error).message);
    return null;
  }
}
