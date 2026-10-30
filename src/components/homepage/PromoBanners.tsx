import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Promo } from "@/types";

/**
 * The row of promo tiles that sits between the product carousels.
 *
 * The banners are rows in the `promos` collection, written in
 * Admin → Promo Banners. This file only draws them, which is why the dashboard
 * can import it for a live preview and get exactly what the homepage shows.
 *
 * A banner without an image is skipped (there would be nothing to draw), and the
 * whole section disappears when nothing is left.
 */
export default function PromoBanners({ banners = [] }: { banners?: Promo[] }) {
  const visibleBanners = banners.filter((banner) => banner.image);

  if (visibleBanners.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 my-8">
      {/* 1. Dual Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleBanners.map((banner, index) => {
          // A blank link still leads somewhere useful instead of nowhere.
          const href = banner.href?.trim() || "/shop";
          const imageAlt = banner.imageAlt?.trim() || banner.title || "Promotion";
          const hasBadge = Boolean(banner.badgeLabel || banner.badgeValue);

          return (
            <div
              key={banner.id || banner._id || `promo-tile-${index}`}
              className="group relative bg-gradient-to-r from-primary/10 via-[var(--surface-alt)] to-[var(--surface-elevated)] rounded-2xl p-6 md:p-8 border border-[var(--border-color)] shadow-xs transition-all duration-300 hover:shadow-md flex items-center justify-between overflow-hidden"
            >
              {/* Left Side: Promo Image */}
              <div className="relative w-1/2 h-44 md:h-48 flex items-center justify-center">
                <Link
                  href={href}
                  className="relative w-full h-full cursor-pointer flex items-center justify-center"
                >
                  <Image
                    src={banner.image as string}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 768px) 50vw, 30vw"
                    className="object-contain transition-transform duration-500 group-hover:scale-105 filter drop-shadow-sm"
                    priority={index === 0}
                  />
                </Link>
              </div>

              {/* Right Side: Text, Badge & CTA */}
              <div className="w-1/2 pl-4 space-y-2.5">
                {banner.subtitle && (
                  <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
                    {banner.subtitle}
                  </p>
                )}

                <h3 className="text-lg md:text-xl font-light text-[var(--foreground)] uppercase leading-snug">
                  {banner.highlightText && (
                    <span className="font-bold text-[var(--foreground)]">
                      {banner.highlightText}{" "}
                    </span>
                  )}
                  {banner.title}
                </h3>

                {/* Badge, e.g. "STARTING AT $79.99" — free text typed by the
                    owner, so it never claims a price the catalog does not have. */}
                {hasBadge && (
                  <div className="pt-1 flex items-baseline gap-1">
                    {banner.badgeLabel && (
                      <span className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase">
                        {banner.badgeLabel}
                      </span>
                    )}
                    {banner.badgeValue && (
                      <span className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
                        {banner.badgeValue}
                      </span>
                    )}

                    {/* With no button text the badge carries the arrow instead. */}
                    {!banner.buttonText && (
                      <Link
                        href={href}
                        className="ml-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center transition-transform group-hover:translate-x-1 shadow-sm cursor-pointer"
                        aria-label={`View ${banner.title || "promotion"}`}
                      >
                        <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </Link>
                    )}
                  </div>
                )}

                {/* Button CTA */}
                {banner.buttonText && (
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 pt-1 text-xs font-bold uppercase tracking-wider text-[var(--foreground)] group-hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{banner.buttonText}</span>
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center transition-transform group-hover:translate-x-1 shadow-sm">
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
