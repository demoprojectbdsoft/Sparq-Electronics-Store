"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { SiteBrandLogo } from "@/types";

/**
 * One logo in the scrolling band.
 *
 * A brand can be an uploaded logo, its name written as text, or a logo with a
 * link. It only becomes a link when the owner typed one, so a logo with no
 * link is not something to click.
 */
export function BrandLogoMark({ brand }: { brand: SiteBrandLogo }) {
  const mark = brand.logo ? (
    <Image
      src={brand.logo}
      alt={brand.name || "Brand logo"}
      width={160}
      height={48}
      className="max-h-10 md:max-h-12 w-auto object-contain"
      unoptimized
    />
  ) : (
    <span className="text-xl font-bold tracking-tight whitespace-nowrap">
      {brand.name}
    </span>
  );

  if (!brand.href) return mark;

  return (
    <Link href={brand.href} className="block">
      {mark}
    </Link>
  );
}

/**
 * The band of partner / supplier logos that scrolls across the homepage.
 *
 * The list is written in Admin → Settings → Logos & Media → Homepage Brand
 * Marquee. With nothing added the band hides itself, so a new store never shows
 * logos of brands it does not work with.
 */
export default function Brand() {
  const { settings } = useSiteSettings();

  // A row with neither a logo nor a name would draw an empty space.
  const brands = (settings.brandLogos ?? []).filter(
    (brand) => brand.logo || brand.name
  );

  if (brands.length === 0) return null;

  return (
    <section className="w-full py-8 my-6 border-y border-[var(--border-color)]/80 dark:border-[var(--border-color)] relative bg-[var(--surface-elevated)]/50 dark:bg-[var(--surface-alt)]/50">
      <Marquee
        gradient={false}
        speed={40}
        pauseOnHover={true}
        className="select-none py-2"
      >
        <div className="flex items-center gap-16 md:gap-24 pr-16 md:pr-24">
          {brands.map((brand, index) => (
            <div
              key={`${brand.name}-${index}`}
              className="flex items-center justify-center text-slate-400 dark:text-[var(--foreground-muted)] grayscale hover:grayscale-0 opacity-70 hover:opacity-100 hover:text-primary transition-all duration-300 shrink-0"
            >
              <BrandLogoMark brand={brand} />
            </div>
          ))}
        </div>
      </Marquee>
    </section>
  );
}
