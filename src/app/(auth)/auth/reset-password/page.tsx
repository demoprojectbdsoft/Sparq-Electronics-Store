import React, { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { getSiteSettings } from "@/lib/api/siteSettings";

export async function generateMetadata() {
  const res = await getSiteSettings();
  const siteName = res?.data?.siteName || "Sparq";

  return {
    title: "Choose a New Password",
    description: `Set a new password for your ${siteName} account.`,
  };
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--surface-alt)] dark:bg-[var(--surface-alt)]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
