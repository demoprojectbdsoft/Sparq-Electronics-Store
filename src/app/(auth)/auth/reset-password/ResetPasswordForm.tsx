"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { authClient } from "@/lib/auth-client";
import SparqLogo from "@/components/shared/SparqLogo";

/** better-auth refuses anything shorter, so the form says so first. */
const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();

  // The emailed link is a better-auth endpoint; it redirects here with the
  // token, or with `error=INVALID_TOKEN` when the link was already used or has
  // expired.
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");
  const linkBroken = !token || Boolean(linkError);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This link is missing its token. Please request a new one.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      // The token is single use. A successful reset also signs the account out
      // on every device, so the new password is needed everywhere.
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setError(
          resetError.message ||
            "The password could not be changed. Please request a new link."
        );
        return;
      }

      toast.success("Password updated!");
      setDone(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "The password could not be changed. Please try again."
      );
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
              Choose a New Password
            </CardTitle>
            <CardDescription className="text-xs text-[var(--foreground-muted)]">
              Pick a password you have not used on this account before.
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

            {linkBroken ? (
              <div className="space-y-4 py-2">
                <Alert status="warning" className="p-4 text-xs rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-amber-800 dark:text-amber-300 space-y-1">
                      <p className="font-bold text-sm">This link has expired</p>
                      <p className="text-xs leading-relaxed">
                        A reset link works once and for one hour. Request a new
                        one and it will arrive in a moment.
                      </p>
                    </AlertDescription>
                  </div>
                </Alert>

                <Link
                  href="/auth/forgot-password"
                  className="flex items-center justify-center h-11 w-full text-xs font-bold bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all"
                >
                  Request a New Link
                </Link>
              </div>
            ) : done ? (
              <div className="space-y-4 py-2">
                <Alert status="success" className="p-4 text-xs rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-emerald-800 dark:text-emerald-300 space-y-1">
                      <p className="font-bold text-sm">Password updated</p>
                      <p className="text-xs leading-relaxed">
                        Next time, sign in with the new password. Other devices
                        were signed out, so they will ask for it too.
                      </p>
                    </AlertDescription>
                  </div>
                </Alert>

                <Link
                  href="/auth/login"
                  className="flex items-center justify-center h-11 w-full text-xs font-bold bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <Form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1 w-full">
                  <Label className="text-xs font-semibold text-[var(--foreground)]">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative w-full">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      fullWidth
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 h-10 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)] text-[var(--foreground)] focus:ring-2 focus:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer z-10"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--foreground-muted)]">
                    At least {MIN_PASSWORD_LENGTH} characters.
                  </p>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="text-xs font-semibold text-[var(--foreground)]">
                    Confirm New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative w-full">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      fullWidth
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-9 h-10 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--surface-alt)] text-[var(--foreground)] focus:ring-2 focus:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer z-10"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isDisabled={loading}
                  className="h-11 text-xs font-bold bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 w-full"
                >
                  {loading ? "Saving New Password..." : "Save New Password"}
                </Button>
              </Form>
            )}

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground-muted)] hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
