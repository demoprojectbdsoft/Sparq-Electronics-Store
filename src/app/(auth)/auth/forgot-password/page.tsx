import React from "react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { getSiteSettings } from "@/lib/api/siteSettings";

export async function generateMetadata() {
  const res = await getSiteSettings();
  const siteName = res?.data?.siteName || "Sparq";

  return {
    title: "Forgot Password",
    description: `Reset your ${siteName} account password.`,
  };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
