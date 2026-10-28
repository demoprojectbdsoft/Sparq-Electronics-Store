import type { Metadata, Viewport } from "next";
import { Open_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastContainer } from "react-toastify";
import { getFaviconType } from "@/lib/favicon";

// 1. Initialize Primary Font (Open Sans)
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

// 2. Initialize Secondary Font (Poppins)
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

import { getSiteSettings } from "@/lib/api/siteSettings";

// Viewport configuration for standalone PWA & responsive displays
export const viewport: Viewport = {
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const res = await getSiteSettings();
  const settings = res?.data;

  const siteName = settings?.siteName || "Sparq";
  const metaTitle = settings?.metaTitle || `${siteName} - Premium Online Store`;
  const metaDesc =
    settings?.metaDescription ||
    `${siteName} - Premium Store with best deals, fast shipping, and top-tier products.`;
  // The favicon is the single source of truth for both the browser tab icon
  // and the PWA manifest. Whatever image format the admin uploads (ICO, PNG,
  // JPG, WEBP, SVG, GIF) is applied to both — the MIME type is derived from
  // the extension so browsers never see a mismatched type.
  const favicon = settings?.faviconUrl || "/icon.svg";
  const faviconType = getFaviconType(favicon);

  return {
    title: {
      default: metaTitle,
      template: `%s | ${siteName}`,
    },
    description: metaDesc,
    manifest: "/manifest.webmanifest",
    applicationName: siteName,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: siteName,
    },
    formatDetection: {
      telephone: false,
    },
    icons: [
      {
        url: favicon,
        sizes: "any",
        type: faviconType,
      },
      {
        url: favicon,
        sizes: "16x16",
        type: faviconType,
      },
      {
        url: favicon,
        sizes: "32x32",
        type: faviconType,
      },
      {
        url: favicon,
        sizes: "48x48",
        type: faviconType,
      },
      {
        url: favicon,
        sizes: "180x180",
        type: faviconType,
        rel: "apple-touch-icon",
      },
    ],
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const res = await getSiteSettings();
  const siteSettings = res?.data || null;
  const cp = siteSettings?.colorPalette;


  const brandFlat = cp?.topBarVia  || cp?.primary || "#0284c7";
  const gradFrom  = cp?.topBarFrom || cp?.primary || "#1d4ed8";
  const gradTo    = cp?.topBarTo   || cp?.primary || "#4338ca";

  // SSR: Only inject --site-* intermediary tokens.
  // Derived tokens (--brand-flat, --surface, --surface-elevated, etc.) are
  // computed by globals.css color-mix() for each mode — overriding them here
  // would break dark mode since .dark class rules cannot beat :root inline styles.
  const initialPaletteCss = cp
    ? `:root {
  --site-primary: ${cp.primary || "#0284c7"};
  --site-primary-dark: ${cp.primaryDark || "#0369a1"};
  --site-secondary: ${cp.secondary || "#6366f1"};
  --site-accent: ${cp.accent || "#f59e0b"};
  --site-bg: ${cp.background || "#ffffff"};
  --site-bg-dark: ${cp.backgroundDark || "#0b0f19"};
  --site-surface: ${cp.surface || "#f8fafc"};
  --site-surface-dark: ${cp.surfaceDark || "#131d2e"};
  --site-topbar-from: ${gradFrom};
  --site-topbar-via: ${brandFlat};
  --site-topbar-to: ${gradTo};
}`
    : "";

  // Dynamic theme-color meta
  const brandColor = brandFlat;
  const darkBgColor = cp?.backgroundDark || "#0b0f19";


  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${openSans.variable} ${poppins.variable}`}
    >
      <head suppressHydrationWarning>
        {/* Dynamic palette CSS variables (SSR) */}
        {initialPaletteCss && (
          <style
            id="ssr-site-palette"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: initialPaletteCss }}
          />
        )}
        {/* Dynamic theme-color for PWA / browser chrome — derived from active palette */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content={brandColor} />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content={darkBgColor} />
      </head>
      <body className="font-sans bg-background text-foreground antialiased">
        <Providers initialSettings={siteSettings}>
          {children}
          <ToastContainer autoClose={2000} />
        </Providers>
      </body>
    </html>
  );
}