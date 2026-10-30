"use client";

import React, { useState } from "react";
import { User } from "lucide-react";

/**
 * Profile photo with a safe fallback.
 *
 * Google profile pictures (and any other outside host) can fail to load — an
 * expired link, a blocked request or a dropped connection — and plenty of
 * accounts never set a photo at all. In both cases a broken image icon used to
 * be left on the page, so the circle falls back to the name's first letter and,
 * when there is no name either, to a person outline.
 *
 * A plain <img> is used on purpose: it keeps the outside URL untouched and lets
 * onError fire immediately, which next/image cannot do for us.
 */
export default function UserAvatar({
  src,
  name,
  size = 32,
  className = "",
  alt,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}) {
  // The URL that failed is remembered instead of a simple true/false flag, so a
  // different photo gets a fresh attempt without needing an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const url = typeof src === "string" ? src.trim() : "";
  const hasUsablePhoto =
    url.length > 0 &&
    url !== "undefined" &&
    url !== "null" &&
    url !== failedSrc;

  const cleanName = (name || "").trim();
  const initial = cleanName.charAt(0).toUpperCase();

  if (!hasUsablePhoto) {
    return (
      <div
        className={`flex items-center justify-center font-bold shrink-0 select-none ${className}`}
        style={{ width: size, height: size }}
      >
        {initial ? (
          <span>{initial}</span>
        ) : (
          <User className="w-1/2 h-1/2" aria-label="Account" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* next/image cannot report a failed download back to us, so a plain img
          is deliberate here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt || cleanName || "User avatar"}
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailedSrc(url)}
      />
    </div>
  );
}
