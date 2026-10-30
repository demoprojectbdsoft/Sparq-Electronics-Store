"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Form,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  Button,
  Alert,
  AlertDescription,
} from "@heroui/react";
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { isEmailRegistered } from "@/lib/action/account";
import SparqLogo from "@/components/shared/SparqLogo";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const address = email.trim();

    if (!address) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      // better-auth answers the same way for every address, so the account is
      // checked first. Without this, a mistyped email shows "check your inbox"
      // while no link is ever sent.
      const registered = await isEmailRegistered(address);
      if (!registered) {
        setError(
          "No account uses this email address. Check the spelling, or create an account first."
        );
        return;
      }

      // better-auth creates a one-time token and emails the link through the
      // store API.
      const { error: requestError } = await authClient.requestPasswordReset({
        email: address,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (requestError) {
        setError(
          requestError.message ||
            "The reset link could not be sent. Please try again."
        );
        return;
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--surface-alt)]">
      <div className="w-full max-w-md space-y-4">
        {/* Brand logo & tagline */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <SparqLogo size="lg" />
          <p className="text-xs text-[var(--foreground-muted)]">
            Password Recovery Service
          </p>
        </div>

        <Card className="w-full border border-[var(--border-color)] shadow-xl bg-[var(--surface-elevated)] rounded-2xl">
          <CardHeader className="flex flex-col gap-1 text-center pb-2 pt-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-xs text-[var(--foreground-muted)]">
              No worries! Enter your email address and we&apos;ll send you instructions to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 p-6 pt-2">
            {error && (
              <Alert status="danger" className="p-3 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
                <AlertDescription className="text-red-700 dark:text-red-300 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {submitted ? (
              <div className="space-y-4 py-2">
                <Alert status="success" className="p-4 text-xs rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-emerald-800 dark:text-emerald-300 space-y-1">
                      <p className="font-bold text-sm">Check your inbox</p>
                      <p className="text-xs leading-relaxed">
                        A reset link is on its way to <span className="font-semibold">{email}</span>. It works once and expires in one hour. If it is not in your inbox after a minute, look in the spam folder.
                      </p>
                    </AlertDescription>
                  </div>
                </Alert>

                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setSubmitted(false)}
                  className="h-10 text-xs font-semibold border-[var(--border-color)] rounded-xl hover:bg-[var(--surface-alt)] cursor-pointer w-full text-[var(--foreground)]"
                >
                  Resend Instructions
                </Button>
              </div>
            ) : (
              <Form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1 w-full">
                  <Label className="text-xs font-semibold text-[var(--foreground)]">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative w-full">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      fullWidth
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 h-10 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)] text-[var(--foreground)] focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isDisabled={loading}
                  className="h-11 text-xs font-bold bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 w-full"
                >
                  {loading ? (
                    "Sending Reset Link..."
                  ) : (
                    <>
                      Send Reset Instructions
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </Form>
            )}

            <div className="text-center pt-2 space-y-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground-muted)] hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
              <p className="text-xs text-[var(--foreground-muted)]">
                No account yet?{" "}
                <Link
                  href="/auth/register"
                  className="font-semibold text-primary hover:text-primary-hover hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
