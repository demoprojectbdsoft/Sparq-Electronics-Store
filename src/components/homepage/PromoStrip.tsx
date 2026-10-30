import Link from "next/link";
import Image from "next/image";
import { Promo } from "@/types";

/**
 * The full-width promo strip that runs lower down the homepage.
 *
 * It draws one banner whose `placement` is "strip", written in
 * Admin → Promo Banners. Like the tiles, this file is shared with the dashboard
 * so its preview is the real thing. No banner, no image, no section.
 */
export default function PromoStrip({ strip }: { strip?: Promo | null }) {
  if (!strip?.image) return null;

  const href = strip.href?.trim() || "/shop";
  const imageAlt = strip.imageAlt?.trim() || strip.title || "Promotion";
  const hasBadge = Boolean(strip.badgeLabel || strip.badgeValue);

  return (
    /* Full-bleed outer wrapper spanning 100% viewport width */
    <section className="w-full bg-linear-to-r from-[var(--surface)] via-primary/5 to-[var(--surface-alt)] border-y border-[var(--border-color)] my-10">
      {/* Constrained container centered within the full-width strip */}
      <div className="max-w-7xl mx-auto px-4">
        <Link href={href} className="group block w-full transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-6 md:py-0 min-h-[140px] md:h-36 relative overflow-hidden">
            {/* 1. Content Area: Headline & Badge */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 z-10 text-center">
              {/* Banner Text */}
              <h2 className="text-base md:text-xl font-light text-[var(--foreground-muted)] tracking-wider uppercase leading-snug">
                {strip.subtitle}{" "}
                <span className="font-extrabold text-[var(--foreground)]">
                  {strip.highlightText}
                </span>{" "}
                {strip.title}
              </h2>

              {/* Accent Badge — free text, so it never claims a price the
                  catalog does not have */}
              {hasBadge && (
                <div className="inline-flex flex-col items-center justify-center bg-brand-gradient text-[var(--on-grad-text)] px-5 py-2.5 rounded-xl shadow-brand group-hover:scale-105 transition-transform duration-300 shrink-0">
                  {strip.badgeLabel && (
                    <span className="text-[9px] whitespace-nowrap font-bold tracking-widest uppercase opacity-90 leading-tight">
                      {strip.badgeLabel}
                    </span>
                  )}
                  {strip.badgeValue && (
                    <div className="flex items-start font-black text-2xl md:text-3xl leading-none tracking-tighter pt-0.5">
                      {strip.badgeValue}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Promo Image Area */}
            <div className="relative w-full md:w-64 h-32 md:h-full flex items-center justify-center">
              <div className="relative w-full h-full max-w-xs transition-transform duration-500 group-hover:scale-105">
                <Image
                  src={strip.image}
                  alt={imageAlt}
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
