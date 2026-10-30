/**
 * One promo banner, created and edited in Admin → Promo Banners.
 *
 * A banner is a stored row rather than a field on Site Settings, so the admin can
 * name it, switch it on or off, order it, and keep as many as the storefront has
 * room for. `placement` decides where it appears: "tile" is one of the blocks in
 * the row of tiles, "strip" is the wide block further down the homepage.
 */
export interface Promo {
  id?: string;
  _id?: string;
  /** Internal label, shown only in the dashboard. */
  name: string;
  placement: "tile" | "strip";
  isActive: boolean;
  /** Small line above the title on a tile, and the words before the title on the strip. */
  subtitle?: string;
  /** The bold word inside the title. */
  highlightText?: string;
  title?: string;
  /** A banner without an image is never shown. */
  image?: string;
  imageAlt?: string;
  /** Blank falls back to /shop. */
  href?: string;
  buttonText?: string;
  /** e.g. STARTING AT */
  badgeLabel?: string;
  /** e.g. $79.99 */
  badgeValue?: string;
  /** Lower numbers show first. */
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}
