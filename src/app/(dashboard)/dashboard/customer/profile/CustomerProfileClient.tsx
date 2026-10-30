"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, Button, Input } from "@heroui/react";
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  ShieldX,
  Save,
  Coins,
  Crown,
  Phone,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Bookmark,
  Trash2,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { authClient } from "@/lib/auth-client";
import { updateUser } from "@/lib/action/user";
import { removeAddress, setDefaultAddress } from "@/lib/action/address";
import ImageUploader from "@/components/shared/ImageUploader";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { SavedAddress } from "@/types";
import { RealCustomerProfile } from "./page";

interface CustomerProfileClientProps {
  initialProfile: RealCustomerProfile;
  /** The customer's address book, newest first with the default at the top. */
  initialAddresses?: SavedAddress[];
}

export default function CustomerProfileClient({
  initialProfile,
  initialAddresses = [],
}: CustomerProfileClientProps) {
  const [profile, setProfile] = useState<RealCustomerProfile>(initialProfile);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [name, setName] = useState(initialProfile.name || "");
  const [imageUrl, setImageUrl] = useState(initialProfile.image || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [isSaving, setIsSaving] = useState(false);

  // ── Saved Address Book ─────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  // The address currently being changed, so only that row shows it is busy.
  const [busyAddressId, setBusyAddressId] = useState("");
  // Two-step delete: the first click asks, the second one removes.
  const [confirmRemoveId, setConfirmRemoveId] = useState("");

  const { data: session } = authClient.useSession();
  const { settings, formatPrice } = useSiteSettings();
  const supportEmail = settings.supportEmail || "support@sparq.com";
  const siteName = settings.siteName || "Sparq";
  const sessionUser = session?.user as { id?: string } | undefined;

  // Fetch live DB data on mount to get up-to-date member/points
  useEffect(() => {
    const userId = profile.id || sessionUser?.id;
    if (!userId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    fetch(`${apiUrl}/users/${userId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json?.data ?? json;
        if (data) {
          setProfile((prev) => ({
            ...prev,
            member: data.member ?? prev.member,
            points: typeof data.points === "number" ? data.points : prev.points,
            status: data.status ?? prev.status,
            plan: data.plan ?? prev.plan,
            role: data.role ?? prev.role,
          }));
        }
      })
      .catch(() => {
        // Silently fallback to initial server-rendered data
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, sessionUser?.id]);

  const memberTierName =
    profile.member.charAt(0).toUpperCase() + profile.member.slice(1);

  const getTierColors = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "diamond":
        return {
          bg: "bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300",
          badge: "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white",
          iconColor: "text-cyan-500",
        };
      case "platinum":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
          badge: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
          iconColor: "text-purple-500",
        };
      case "gold":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
          badge: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white",
          iconColor: "text-amber-500",
        };
      default: // silver
        return {
          bg: "bg-[var(--surface-alt)] dark:bg-[var(--surface)]/60 border-[var(--border-color)] dark:border-[var(--border-color)] text-[var(--foreground-secondary)] dark:text-[var(--foreground-secondary)]",
          badge: "bg-gradient-to-r from-slate-500 to-gray-600 text-white",
          iconColor: "text-[var(--foreground-muted)]",
        };
    }
  };

  const tierColors = getTierColors(profile.member);

  // Manual refresh of live data
  const handleRefreshLiveData = async () => {
    const userId = profile.id || sessionUser?.id;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!userId || !apiUrl) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`${apiUrl}/users/${userId}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data ?? json;
        if (data) {
          setProfile((prev) => ({
            ...prev,
            member: data.member ?? prev.member,
            points: typeof data.points === "number" ? data.points : prev.points,
            status: data.status ?? prev.status,
            plan: data.plan ?? prev.plan,
            role: data.role ?? prev.role,
          }));
          toast.success("Profile data refreshed!");
        }
      }
    } catch {
      toast.error("Failed to refresh live data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      if (profile.id) {
        await updateUser(profile.id, {
          name: name.trim(),
          image: imageUrl.trim() || undefined,
          phone: phone.trim(),
          bio: bio.trim(),
        });
      }
      setProfile((prev) => ({
        ...prev,
        name: name.trim(),
        image: imageUrl.trim() || prev.image,
        phone: phone.trim(),
        bio: bio.trim(),
      }));
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Saved Address Handlers ────────────────────────────────────────────────

  // Make one address the default; checkout pre-fills from that one.
  const handleMakeDefault = async (id: string) => {
    setBusyAddressId(id);
    try {
      const res = await setDefaultAddress(id);
      if (res?.success === false) {
        toast.error(res?.message || "Could not change the default address.");
        return;
      }
      // Only one address may be the default, so flip the badge locally too.
      setAddresses((prev) =>
        prev.map((item) => ({ ...item, isDefault: item._id === id }))
      );
      toast.success("Default address updated.");
    } catch {
      toast.error("Could not change the default address.");
    } finally {
      setBusyAddressId("");
    }
  };

  const handleRemoveAddress = async (id: string) => {
    setBusyAddressId(id);
    try {
      const res = await removeAddress(id);
      if (res?.success === false) {
        toast.error(res?.message || "Could not remove the address.");
        return;
      }

      setAddresses((prev) => {
        const wasDefault = prev.find((item) => item._id === id)?.isDefault;
        const remaining = prev.filter((item) => item._id !== id);
        // The backend promotes a survivor when the default is removed, so the
        // list on screen keeps the same rule.
        if (wasDefault && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isDefault: true };
        }
        return remaining;
      });
      setConfirmRemoveId("");
      toast.success("Address removed.");
    } catch {
      toast.error("Could not remove the address.");
    } finally {
      setBusyAddressId("");
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] mb-1">
          <Link href="/dashboard/customer" className="hover:text-primary transition-colors">
            Customer Dashboard
          </Link>
          <span>/</span>
          <span className="text-primary">Profile</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          My Account{" "}
          <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Profile
          </span>
        </h1>
        <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1">
          View and manage your personal details, bio, contact number, and membership perks.
        </p>
      </div>

      {/* ── Profile Header Card ── */}
      <Card className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary to-primary-hover p-1 shadow-md shadow-primary/20 overflow-hidden">
              <Image
                src={imageUrl || profile.image}
                alt={profile.name}
                fill
                sizes="96px"
                className="object-cover rounded-[22px]"
                unoptimized
              />
            </div>
          </div>

          {/* User Meta */}
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                {profile.name}
              </h2>

              {/* Account Status Badge */}
              {profile.status === "suspended" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                  <ShieldX className="w-3.5 h-3.5 text-rose-500" />
                  Account Suspended
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Active Customer
                </span>
              )}

              {/* Member Tier Badge — live data */}
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${tierColors.badge}`}>
                <Crown className="w-3.5 h-3.5" />
                {memberTierName} Tier
              </span>
            </div>

            {profile.bio && (
              <p className="text-xs text-[var(--foreground-muted)] max-w-lg">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-[var(--foreground-muted)]">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                {profile.email}
              </span>
              {profile.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                  {profile.phone}
                </span>
              )}
              {/* Live Points */}
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-[var(--foreground)]">
                  {profile.points.toLocaleString()}
                </span>{" "}
                Points
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                Member since {profile.memberSince}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Suspended Account Alert Banner ── */}
      {profile.status === "suspended" && (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 shadow-xs">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300 mb-0.5">
              Your account has been suspended
            </p>
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90 leading-relaxed">
              Access to purchases, cart, and checkout has been restricted. If you believe this is a mistake or need further assistance, please{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="underline underline-offset-2 font-bold hover:text-rose-800 dark:hover:text-rose-200 transition-colors"
              >
                contact our support team ({supportEmail})
              </a>
              {" "}or reach out to the store admin directly.
            </p>
          </div>
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details Form */}
        <Card className="lg:col-span-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)]">
              Personal Information
            </h3>
            <p className="text-xs text-[var(--foreground-muted)]">
              Update your display name, contact phone, avatar, and personal bio.
            </p>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
            {/* Image Uploader supporting both Upload File & Direct URL */}
            <div className="space-y-1">
              <ImageUploader
                label="Profile Avatar Picture"
                value={imageUrl}
                onChange={setImageUrl}
                urlPlaceholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--foreground)]">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-10 rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)] focus:border-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--foreground)]">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full h-10 rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)] focus:border-primary text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--foreground)]">
                Email Address
              </label>
              <Input
                type="email"
                value={profile.email}
                disabled
                className="w-full h-10 rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)] text-[var(--foreground-muted)] cursor-not-allowed text-xs"
              />
              <p className="text-[10px] text-[var(--foreground-muted)]">
                Email address is linked to your authentication login.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--foreground)]">
                Personal Bio / About Me
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little bit about yourself..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)] focus:border-primary focus:outline-none text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                isDisabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-bold transition-all shadow-md shadow-primary/20 cursor-pointer h-10 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Membership & Rewards Summary Card */}
        <div className="space-y-6">
          <Card className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  Membership &amp; Perks
                </h3>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Your live tier benefits and loyalty balance
                </p>
              </div>
              {/* Refresh live data button */}
              <button
                type="button"
                onClick={handleRefreshLiveData}
                disabled={isRefreshing}
                title="Refresh live membership data"
                className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Current Tier Box — live data */}
            <div className={`p-4 rounded-xl border ${tierColors.bg} space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className={`w-4 h-4 ${tierColors.iconColor}`} />
                  <span className="text-xs font-bold capitalize">
                    {memberTierName} Tier
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--surface-elevated)]/70 dark:bg-black/40">
                  {profile.plan} Plan
                </span>
              </div>
              <p className="text-[11px] text-[var(--foreground-secondary)] dark:text-[var(--foreground-muted)]">
                Earn reward points on every order to redeem instant store discounts.
              </p>
            </div>

            {/* Reward Points Box — live data */}
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)]/50 dark:bg-[var(--surface-alt)]/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {siteName} Reward Points
                  </span>
                </div>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {profile.points.toLocaleString()} pts
                </span>
              </div>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Equivalent to{" "}
                <span className="font-bold text-[var(--foreground)]">
                  {formatPrice(profile.points * 0.01)}
                </span>{" "}
                in store credit.
              </p>

              {/* Next tier progress hint */}
              {profile.member?.toLowerCase() !== "diamond" && (
                <div className="pt-1 text-[10px] text-[var(--foreground-muted)]">
                  {profile.member?.toLowerCase() === "silver" && (
                    <span>🥇 <strong>{(1000 - profile.points).toLocaleString()}</strong> pts to Gold</span>
                  )}
                  {profile.member?.toLowerCase() === "gold" && (
                    <span>🟣 <strong>{(4000 - profile.points).toLocaleString()}</strong> pts to Platinum</span>
                  )}
                  {profile.member?.toLowerCase() === "platinum" && (
                    <span>💎 <strong>{(10000 - profile.points).toLocaleString()}</strong> pts to Diamond</span>
                  )}
                </div>
              )}
              {profile.member?.toLowerCase() === "diamond" && (
                <p className="pt-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                  💎 You have reached the highest Diamond tier!
                </p>
              )}
            </div>

            {/* Account Status */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)] text-xs">
              <div className="flex items-center justify-between text-[var(--foreground-muted)]">
                <span>Account Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                  {profile.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--foreground-muted)]">
                <span>Account Role</span>
                <span className="font-semibold text-[var(--foreground)] capitalize">
                  {profile.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--foreground-muted)]">
                <span>Email Verified</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {profile.emailVerified ? "Yes" : "Pending"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Saved Shipping Addresses ── */}
      <Card className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)]">
              Saved Addresses
            </h3>
            <p className="text-xs text-[var(--foreground-muted)]">
              Checkout fills in the default address. Up to 5 can be kept.
            </p>
          </div>
          <Link
            href="/checkout"
            className="text-xs font-bold text-primary hover:underline self-start sm:self-auto"
          >
            Add one at checkout
          </Link>
        </div>

        {addresses.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-[var(--border-color)] text-center space-y-1.5">
            <Bookmark className="w-6 h-6 text-[var(--foreground-muted)] mx-auto" />
            <p className="text-xs font-semibold text-[var(--foreground)]">
              No saved addresses yet
            </p>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Tick &quot;Save this address for next time&quot; when you place an order.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addresses.map((item) => (
              <div
                key={item._id}
                className={`p-4 rounded-xl border space-y-2 ${
                  item.isDefault
                    ? "border-primary/40 bg-primary/5"
                    : "border-[var(--border-color)] bg-[var(--surface-alt)]/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {item.label}
                  </span>
                  {item.isDefault && (
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                      Default
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-[var(--foreground-muted)] space-y-0.5">
                  <p className="font-semibold text-[var(--foreground)]">{item.fullName}</p>
                  <p>{item.address}</p>
                  <p>
                    {item.city} {item.postalCode}
                  </p>
                  <p className="flex items-center gap-1 pt-0.5">
                    <Phone className="w-3 h-3" />
                    {item.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {!item.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleMakeDefault(item._id)}
                      disabled={busyAddressId === item._id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      Make default
                    </button>
                  )}

                  {confirmRemoveId === item._id ? (
                    <span className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(item._id)}
                        disabled={busyAddressId === item._id}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {busyAddressId === item._id ? "Removing..." : "Remove"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId("")}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[var(--surface-alt)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(item._id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
