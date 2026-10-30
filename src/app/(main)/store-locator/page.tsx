"use client";

import React, { useState, useMemo } from "react";
import {
  MapPin,
  Search,
  Phone,
  Clock,
  Navigation,
  Store,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { StoreLocation } from "@/types/storeLocator";
import { useSiteSettings } from "@/context/SiteSettingsContext";



const STORES_DATA: StoreLocation[] = [
  {
    id: "london-flagship",
    name: "Flagship Store",
    address: "17 Princess Road, Regent's Park",
    city: "London",
    state: "Greater London",
    zip: "NW1 8JR",
    phone: "(800) 8001-8588",
    distance: "0.8 miles",
    isOpen: true,
    hours: "Mon - Sat: 9:00 AM - 9:00 PM | Sun: 10:00 AM - 6:00 PM",
    services: ["In-Store Pickup", "Tech Support Bar", "Same-Day Repair", "Demo Zone"],
    lat: 51.535,
    lng: -0.155,
  },
  {
    id: "oxford-street",
    name: "Oxford Street",
    address: "221 Oxford Street",
    city: "London",
    state: "Greater London",
    zip: "W1D 2HG",
    phone: "(0600) 874 548",
    distance: "2.4 miles",
    isOpen: true,
    hours: "Mon - Sat: 10:00 AM - 8:00 PM | Sun: 11:00 AM - 5:00 PM",
    services: ["In-Store Pickup", "Demo Zone"],
    lat: 51.515,
    lng: -0.141,
  },
  {
    id: "westfield-stratford",
    name: "Westfield Stratford",
    address: "Montfichet Road, Olympic Park",
    city: "London",
    state: "Greater London",
    zip: "E20 1EJ",
    phone: "(0600) 874 990",
    distance: "5.7 miles",
    isOpen: false,
    hours: "Mon - Sat: 10:00 AM - 9:00 PM | Sun: 12:00 PM - 6:00 PM",
    services: ["In-Store Pickup", "Tech Support Bar", "Same-Day Repair"],
    lat: 51.543,
    lng: -0.006,
  },
  {
    id: "manchester-arndale",
    name: "Manchester Arndale",
    address: "Exchange Court, Market Street",
    city: "Manchester",
    state: "Greater Manchester",
    zip: "M4 3AQ",
    phone: "(0161) 992 0110",
    distance: "184 miles",
    isOpen: true,
    hours: "Mon - Sat: 9:00 AM - 8:00 PM | Sun: 11:00 AM - 5:00 PM",
    services: ["In-Store Pickup", "Tech Support Bar"],
    lat: 53.483,
    lng: -2.242,
  },
];

export default function StoreLocatorPage() {
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || "Sparq";
  const mainAddress = settings.address || "17 Princess Road, London, Greater London NW1 8JR, UK";
  const mainPhone = settings.supportPhone || "(800) 8001-8588";

  // Store names are stored as branches only; the brand prefix comes from settings
  // so a rename in the admin panel flows through every outlet automatically.
  const allStores = useMemo<StoreLocation[]>(() => {
    const named = STORES_DATA.map((store) => ({
      ...store,
      name: `${siteName} ${store.name}`,
    }));

    named[0] = {
      ...named[0],
      address: mainAddress,
      phone: mainPhone,
      hours: settings.openingHours || named[0].hours,
    };

    return named;
  }, [siteName, mainAddress, mainPhone, settings.openingHours]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>(allStores[0].id);

  // Filter stores based on search query
  const filteredStores = useMemo(() => {
    return allStores.filter((store) => {
      const q = searchQuery.toLowerCase();
      return (
        store.name.toLowerCase().includes(q) ||
        store.city.toLowerCase().includes(q) ||
        store.zip.toLowerCase().includes(q) ||
        store.address.toLowerCase().includes(q)
      );
    });
  }, [allStores, searchQuery]);

  const activeStore = useMemo(() => {
    return allStores.find((s) => s.id === selectedStoreId) || filteredStores[0] || allStores[0];
  }, [allStores, selectedStoreId, filteredStores]);

  return (
    <section className="w-full text-[var(--foreground)] dark:text-[var(--foreground)] py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {/* ── Page Header ── */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold tracking-wide uppercase">
            <Store className="w-4 h-4 stroke-[2.2]" />
            Find Us Nearby
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[var(--foreground)]">
            Store <span className="text-gradient-primary">Locator</span>
          </h1>
          <p className="text-sm md:text-base text-[var(--foreground-muted)]">
            Find a {siteName} retail outlet near you to browse products in person, pick up online orders, or get instant support.
          </p>
        </div>

        {/* ── Search Bar ── */}
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--foreground-muted)]">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, address, or postal code (e.g. London, NW1)..."
              className="w-full pl-11 pr-4 py-3.5 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs placeholder:text-[var(--foreground-muted)]"
            />
          </div>
        </div>

        {/* ── Main Interactive Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Store Cards Sidebar (Span 5) */}
          <div className="lg:col-span-5 space-y-4 max-h-[680px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider px-1">
              <span>Results ({filteredStores.length})</span>
              <span>Distance</span>
            </div>

            {filteredStores.length === 0 ? (
              <div className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-8 text-center space-y-3">
                <MapPin className="w-8 h-8 text-[var(--foreground-muted)] mx-auto" />
                <h3 className="font-bold text-[var(--foreground)]">No Stores Found</h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                  We couldn't find any stores matching "{searchQuery}". Try searching for another location.
                </p>
              </div>
            ) : (
              filteredStores.map((store) => {
                const isSelected = store.id === activeStore.id;
                return (
                  <div
                    key={store.id}
                    onClick={() => setSelectedStoreId(store.id)}
                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${
                      isSelected
                        ? "bg-[var(--surface-elevated)] border-primary shadow-md ring-2 ring-primary/20"
                        : "bg-[var(--surface-elevated)] border-[var(--border-color)] hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[var(--foreground)] text-base">
                          {store.name}
                        </h3>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1">
                          {store.address}, {store.city} {store.zip}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-primary shrink-0 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                        {store.distance}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-xs">
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        store.isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {store.isOpen ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Open Now</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Closed Now</span>
                          </>
                        )}
                      </span>

                      <span className="text-[var(--foreground-muted)]">|</span>

                      <span className="text-[var(--foreground-muted)] flex items-center gap-1 truncate">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {store.phone}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Store Map Preview & Full Details (Span 7) */}
          <div className="lg:col-span-7 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
            
            {/* Map Placeholder Box */}
            <div className="relative w-full h-64 md:h-72 bg-[var(--surface-alt)] rounded-2xl overflow-hidden border border-[var(--border-color)] flex flex-col items-center justify-center p-6 text-center group">
              <div className="relative z-10 flex flex-col items-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--foreground)] text-lg">
                    {activeStore.name}
                  </h4>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    {activeStore.address}, {activeStore.city}, {activeStore.state} {activeStore.zip}
                  </p>
                </div>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${activeStore.address}, ${activeStore.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              </div>
            </div>

            {/* Store Detailed Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Working Hours */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Opening Hours</span>
                </div>
                <p className="text-xs md:text-sm text-[var(--foreground-muted)] leading-relaxed bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-color)]">
                  {activeStore.hours}
                </p>
              </div>

              {/* Available Store Services */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  <Store className="w-4 h-4 text-primary" />
                  <span>Services Available</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeStore.services.map((service, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-alt)] text-xs font-medium text-[var(--foreground)]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      {service}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}