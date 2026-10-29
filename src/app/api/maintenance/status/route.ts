import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let cachedMongoClient: MongoClient | null = null;

async function getMongoSettings() {
  const uri = process.env.MONGODB_URI;
  // The Atlas database is still physically named `electro`; renaming it here
  // without migrating the data would silently point at an empty database.
  const dbName = process.env.DATABASE || "electro";
  if (!uri) return null;

  try {
    if (!cachedMongoClient) {
      cachedMongoClient = new MongoClient(uri);
      await cachedMongoClient.connect();
    }
    const db = cachedMongoClient.db(dbName);
    const settings = await db.collection("sitesettings").findOne();
    return settings;
  } catch (err) {
    console.error("[Maintenance API] Direct MongoDB read failed:", err);
    return null;
  }
}

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // 1. Primary: Try reading from Express Backend
  try {
    const res = await fetch(`${apiUrl}/site-settings`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(1500),
    });

    if (res.ok) {
      const data = await res.json();
      const s = data?.data || data;
      return NextResponse.json(
        {
          success: true,
          maintenanceMode: !!s?.maintenanceMode,
          settings: {
            siteName: s?.siteName || "Sparq",
            siteTagline: s?.siteTagline || "Better products. A brighter you.",
            supportEmail: s?.supportEmail || "support@sparq.com",
            supportPhone: s?.supportPhone || "(800) 8001-8588",
            socialLinks: s?.socialLinks || [],
            navbarLogo: s?.navbarLogo || null,
            colorPalette: s?.colorPalette || null,
            maintenanceMode: !!s?.maintenanceMode,
          },
          timestamp: Date.now(),
          source: "backend",
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }
  } catch {
    // Backend API was unreachable or timed out
  }

  // 2. Secondary: Fall back to direct MongoDB read
  try {
    const s = await getMongoSettings();
    return NextResponse.json(
      {
        success: true,
        maintenanceMode: !!s?.maintenanceMode,
        settings: {
          siteName: s?.siteName || "Sparq",
          siteTagline: s?.siteTagline || "Better products. A brighter you.",
          supportEmail: s?.supportEmail || "support@sparq.com",
          supportPhone: s?.supportPhone || "(800) 8001-8588",
          socialLinks: s?.socialLinks || [],
          navbarLogo: s?.navbarLogo || null,
          colorPalette: s?.colorPalette || null,
          maintenanceMode: !!s?.maintenanceMode,
        },
        timestamp: Date.now(),
        source: "database",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        maintenanceMode: false,
        error: (err as Error).message,
        timestamp: Date.now(),
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
