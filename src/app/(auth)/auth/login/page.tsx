import React, { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { getSiteSettings } from "@/lib/api/siteSettings";

export async function generateMetadata() {
  const res = await getSiteSettings();
  const siteName = res?.data?.siteName || "Sparq";

  return {
    // The root layout appends "| <siteName>", so the name isn't repeated here.
    title: "Sign In",
    description: `Sign in to your account to access your ${siteName} dashboard and store settings.`,
  };
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--surface-alt)] dark:bg-[var(--surface-alt)]" />}>
      <LoginForm />
    </Suspense>
  );
}
