/**
 * Shared favicon helpers.
 *
 * A single `faviconUrl` drives BOTH the browser favicon (via Next metadata
 * `icons`) and the PWA web manifest (`/manifest.webmanifest`). This module is
 * the single source of truth for how that URL is interpreted so the two can
 * never drift: whatever image format the admin uploads is applied to both.
 */

/** Image extensions we accept as a favicon. */
export const FAVICON_EXTENSIONS = ["ico", "png", "jpg", "jpeg", "webp", "svg", "gif"];

/** Map a URL/file extension to the correct MIME `type` for `<link>`/manifest. */
export function getFaviconType(src: string): string | undefined {
  const ext = src.split("?")[0].split(".").pop()?.toLowerCase();
  switch (ext) {
    case "svg":
      return "image/svg+xml";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "ico":
      return "image/x-icon";
    default:
      return undefined;
  }
}

/** True when the URL points to a favicon image we know how to serve. */
export function isFaviconImage(src: string): boolean {
  if (!src) return false;
  const ext = src.split("?")[0].split(".").pop()?.toLowerCase();
  return !!ext && FAVICON_EXTENSIONS.includes(ext);
}