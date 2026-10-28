import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Maintenance Proxy & Route Guard
 *
 * Maintenance ON:
 *   • Customers / guests → redirected to /maintenance (dashboard included)
 *   • Admin + Demo Admin (logged in) → full access, dashboard and site
 *
 * Always exempt (so staff can still log in): /auth/*, /api/auth/*,
 * /api/maintenance/*, /api/site-settings, static assets.
 */

// ── Maintenance flag cache (3s) ───────────────────────────────────────────────
const cache = { enabled: false, fetchedAt: 0 };
const CACHE_TTL_MS = 3000;

async function isMaintenanceActive(): Promise<boolean> {
  const now = Date.now();
  if (now - cache.fetchedAt < CACHE_TTL_MS) return cache.enabled;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`${apiBase}/site-settings`, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(tid);

    if (res.ok) {
      const body = await res.json();
      const s = body?.data ?? body;
      cache.enabled = !!s?.maintenanceMode;
      cache.fetchedAt = now;
    }
  } catch {
    // backend unreachable — keep last known value
  }
  return cache.enabled;
}

// ── Staff check (admin / demo admin) ──────────────────────────────────────────
// Asks better-auth who the user is, using the request's cookies.
// Result cached per session cookie for 30s so we don't call it on every request.
const STAFF_ROLES = ["admin", "demoadmin"]; // matched after lowercasing + removing - _ spaces
const staffCache = new Map<string, { staff: boolean; exp: number }>();
const STAFF_TTL_MS = 30_000;

function getSessionCookie(request: NextRequest): string | null {
  // "better-auth.session_token" or "__Secure-better-auth.session_token"
  const c = request.cookies
    .getAll()
    .find((x) => x.name.includes("session_token"));
  return c ? c.value : null;
}

async function isStaff(request: NextRequest): Promise<boolean> {
  const token = getSessionCookie(request);
  if (!token) return false; // not logged in

  const hit = staffCache.get(token);
  if (hit && hit.exp > Date.now()) return hit.staff;

  let staff = false;
  try {
    const res = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      cache: "no-store",
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    if (res.ok) {
      const data = await res.json();
      const role = String(data?.user?.role ?? "")
        .toLowerCase()
        .replace(/[\s_-]/g, "");
      staff = STAFF_ROLES.includes(role);
    }
  } catch {
    // treat as not staff
  }

  if (staffCache.size > 500) staffCache.clear(); // keep memory small
  staffCache.set(token, { staff, exp: Date.now() + STAFF_TTL_MS });
  return staff;
}

// ── Exempt paths (no maintenance check at all) ────────────────────────────────
function isExempt(pathname: string): boolean {
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_static/") ||
    /\.(png|jpe?g|webp|avif|gif|svg|ico|css|js|map|woff2?|ttf|eot)$/i.test(pathname) ||
    ["/favicon.ico", "/icon.svg", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest"].includes(pathname)
  )
    return true;

  if (pathname.startsWith("/auth/") || pathname === "/auth") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/api/maintenance/")) return true;
  if (pathname.startsWith("/api/site-settings")) return true;

  // NOTE: /dashboard/admin is NOT exempt anymore — only staff pass (see below)
  return false;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl;

  if (isExempt(pathname)) return NextResponse.next();

  const maintenance = await isMaintenanceActive();

  const isMaintPath = pathname === "/maintenance" || pathname.startsWith("/maintenance/");
  if (isMaintPath) {
    if (!maintenance && !searchParams.has("preview")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Mode OFF → everything open
  if (!maintenance) return NextResponse.next();

  // Mode ON → staff (admin / demo admin) pass everywhere
  if (await isStaff(request)) return NextResponse.next();

  // Everyone else → maintenance page
  const dest = new URL("/maintenance", request.url);
  if (pathname !== "/") dest.searchParams.set("from", pathname);
  return NextResponse.redirect(dest);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)",
  ],
};