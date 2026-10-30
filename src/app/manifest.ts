import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/api/siteSettings";
import { getFaviconType, isFaviconImage } from "@/lib/favicon";

type ManifestIcon = NonNullable<MetadataRoute.Manifest["icons"]>[number];

// Force per-request evaluation so admin edits to branding show up immediately
// (getSiteSettings already fetches with cache: "no-store", but this also keeps
// the manifest route itself out of the static-optimization cache).
export const dynamic = "force-dynamic";

/**
 * Fully dynamic web manifest — every field is derived from the live site
 * settings (same source-of-truth as the storefront branding):
 *   name             = siteName
 *   description      = metaDescription
 *   theme_color      = cp.topBarVia  → matches --brand-flat / --site-topbar-via
 *   background_color = cp.background → light mode surface
 *   icons            = faviconUrl (falls back to the bundled /icon.svg)
 *
 * Whatever image format the admin uploads (ICO, PNG, JPG, WEBP, SVG, GIF) is
 * applied to BOTH the favicon and the manifest — the type is derived from the
 * extension so browsers never see a mismatched MIME.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const res = await getSiteSettings();
  const data = res?.data;
  const cp = data?.colorPalette;
  const siteName = data?.siteName || "Sparq";
  const siteDesc =
    data?.metaDescription || "Premium Worldwide Online Store";

  // Brand flat color: same derivation as --brand-flat in MaintenanceClient.tsx
  const themeColor = cp?.topBarVia || cp?.primary || "#0284c7";
  const bgColor = cp?.background || "#ffffff";

  // The favicon is the PWA icon too — fall back to the bundled SVG when none
  // is configured so the manifest is never empty.
  const iconSrc = data?.faviconUrl || "/icon.svg";
  const iconType = getFaviconType(iconSrc);

  // If the configured favicon is not a recognised image format, drop the
  // `type` rather than lying about the MIME — browsers fall back to sniffing.
  const icons: ManifestIcon[] =
    iconSrc && isFaviconImage(iconSrc)
      ? [
          {
            src: iconSrc,
            sizes: "any",
            type: iconType,
            purpose: "any",
          },
          {
            src: iconSrc,
            sizes: "any",
            type: iconType,
            purpose: "maskable",
          },
        ]
      : [];

  return {
    name: siteName,
    short_name: siteName,
    description: siteDesc,
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: bgColor,
    theme_color: themeColor,
    icons,
  };
}
