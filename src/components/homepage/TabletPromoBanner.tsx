"use client";

import Link from "next/link";
import Image from "next/image";
import { TabletPromoProps } from "@/types";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface TabletPromoBannerProps {
  tabletPromoData: TabletPromoProps;
}

export default function TabletPromoBanner({ tabletPromoData }: TabletPromoBannerProps) {
  const { currencySymbol } = useSiteSettings();
  const {
    categorySlug = "",
    titlePrefix = "",
    highlightText = "",
    titleSuffix = "",
    startingPrice = "",
    cents = "",
    imageSrc = "",
  } = tabletPromoData || {};

  // With no category slug the strip promotes the whole catalog, so the link still
  // lands on something useful in any store.
  const href = categorySlug ? `/shop?category=${categorySlug}` : "/shop";

  return (
    /* Full-bleed outer wrapper spanning 100% viewport width */
    <section className="w-full bg-linear-to-r from-[var(--surface)] via-primary/5 to-[var(--surface-alt)] border-y border-[var(--border-color)] my-10">
      
      {/* Constrained container centered within the full-width strip */}
      <div className="max-w-7xl mx-auto px-4">
        <Link
          href={href}
          className="group block w-full transition-all duration-300"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-6 md:py-0 min-h-[140px] md:h-36 relative overflow-hidden">
            
            {/* 1. Content Area: Headline & Exact Brand Price Badge */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 z-10 text-center">
              
              {/* Banner Text */}
              <h2 className="text-base md:text-xl font-light text-[var(--foreground-muted)] tracking-wider uppercase leading-snug">
                {titlePrefix}{" "}
                <span className="font-extrabold text-[var(--foreground)]">
                  {highlightText}
                </span>{" "}
                {titleSuffix}
              </h2>

              {/* Accent Brand Price Badge */}
              <div className="inline-flex flex-col items-center justify-center bg-brand-gradient text-[var(--on-grad-text)] px-5 py-2.5 rounded-xl shadow-brand group-hover:scale-105 transition-transform duration-300 shrink-0">
                <span className="text-[9px] whitespace-nowrap font-bold tracking-widest uppercase opacity-90 leading-tight">
                  STARTING AT
                </span>
                <div className="flex items-start font-black text-2xl md:text-3xl leading-none tracking-tighter pt-0.5">
                  <span className="text-sm font-bold align-top leading-none pt-0.5">{currencySymbol}</span>
                  <span>{startingPrice}</span>
                  <span className="text-xs font-bold align-top leading-none pt-0.5">
                    {cents}
                  </span>
                </div>
              </div>

            </div>

            {/* 2. Product Image Area */}
            <div className="relative w-full md:w-64 h-32 md:h-full flex items-center justify-center">
              <div className="relative w-full h-full max-w-xs transition-transform duration-500 group-hover:scale-105">
                <Image
                  src={imageSrc}
                  alt={`${highlightText} ${titleSuffix}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 256px"
                  className="object-contain object-center drop-shadow-md"
                />
              </div>
            </div>

          </div>
        </Link>
      </div>

    </section>
  );
}