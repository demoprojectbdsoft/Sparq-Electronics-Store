"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, Headphones, Award, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function AboutPage() {
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || "Sparq";
  const freeThreshold = settings.shipping?.freeShippingThreshold ?? 50;
  const deliveryDays = settings.shipping?.estimatedDeliveryDays || "2-4 business days";
  const isFreeShipping = settings.shipping?.freeShippingEnabled !== false;

  // ── Editable copy (Admin → Settings → Contact & Socials → About Page) ──
  // Older settings records have no `about` group, so every line falls back to
  // the text this page shipped with.
  const about = settings.about || {};
  const headline =
    about.headline?.trim() || "We Provide High Quality Electronics & Tech Gadgets";
  const intro =
    about.intro?.trim() ||
    `Welcome to ${siteName}, your number one destination for premium consumer electronics, smart gadgets, computers, audio equipment, and tech accessories. We are dedicated to giving you the best online shopping experience.`;
  const headquartersNote =
    about.headquartersNote?.trim() || "Official Storefront & Innovation Center";
  const openingHours =
    settings.openingHours?.trim() || "Mon - Fri: 9:00 AM - 8:00 PM";
  const openingHoursNote =
    about.openingHoursNote?.trim() || "Live helpline & in-store customer assistance";
  const ctaTitle = about.ctaTitle?.trim() || "Ready to explore our latest arrivals?";
  const ctaDescription =
    about.ctaDescription?.trim() ||
    "Browse our wide selection of consumer tech, laptops, smartphones, and gaming consoles today.";

  const features = [
    {
      icon: Truck,
      title: "Fast Delivery",
      desc: isFreeShipping
        ? `Free shipping on qualifying orders over $${freeThreshold} with reliable ${deliveryDays} delivery.`
        : `Guaranteed fast, tracked delivery within ${deliveryDays} across the globe.`,
    },
    {
      icon: ShieldCheck,
      title: "100% Secure Payments",
      desc: "We ensure secure payment with verified SSL encryption and fraud protection.",
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      desc: `Our friendly support team at ${siteName} is one call or email away whenever you need help.`,
    },
    {
      icon: Award,
      title: "Quality Guarantee",
      desc: "All products are backed by authentic manufacturer warranties and quality assurance.",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)] dark:text-[var(--foreground)] font-semibold">About Us</span>
      </nav>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1.5 rounded-full">
          About {siteName}
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--foreground)] tracking-tight">
          {headline}
        </h1>
        <p className="text-sm md:text-base text-[var(--foreground-secondary)] dark:text-[var(--foreground-muted)] leading-relaxed">
          {intro}
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elevated)] shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)]">
                {item.title}
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Store Location & Operational Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block">Headquarters</span>
          <p className="text-sm font-bold text-[var(--foreground)] whitespace-pre-line">{settings.address || "17 Princess Road, London, UK"}</p>
          <p className="text-xs text-[var(--foreground-muted)]">{headquartersNote}</p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block">Opening Hours</span>
          {/* whitespace-pre-line keeps one-day-per-line hours readable. */}
          <p className="text-sm font-bold text-[var(--foreground)] whitespace-pre-line">{openingHours}</p>
          <p className="text-xs text-[var(--foreground-muted)]">{openingHoursNote}</p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block">Direct Channels</span>
          <p className="text-xs font-bold text-[var(--foreground)]">
            Hotline: <span className="text-primary font-bold">{settings.supportPhone || "(800) 8001-8588"}</span>
          </p>
          <p className="text-xs text-[var(--foreground-muted)] truncate">
            Support: <a href={`mailto:${settings.supportEmail || "support@sparq.com"}`} className="text-primary hover:underline">{settings.supportEmail || "support@sparq.com"}</a>
          </p>
          <p className="text-xs text-[var(--foreground-muted)] truncate">
            Contact: <a href={`mailto:${settings.contactEmail || "contact@sparq.com"}`} className="text-primary hover:underline">{settings.contactEmail || "contact@sparq.com"}</a>
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="rounded-2xl bg-gradient-primary text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/20">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold">{ctaTitle}</h2>
          <p className="text-xs md:text-sm text-white/80 max-w-xl">
            {settings.siteTagline ? `${settings.siteTagline} ` : ""}
            {ctaDescription}
          </p>
        </div>
        <Link
          href="/shop"
          className="px-6 py-3.5 rounded-full bg-[var(--surface-elevated)] text-primary font-bold text-xs md:text-sm hover:bg-[var(--surface-elevated)]/90 transition-colors shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <span>Shop Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
