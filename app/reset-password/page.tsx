"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/logo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setConfirmPasswordError("");
    setFormError("");

    if (!token) {
      setFormError("Missing reset token. Please request a new reset link.");
      return;
    }
    if (!email) {
      setFormError("Please provide your email address.");
      return;
    }
    if (!hasMinLength || !hasLower || !hasUpper || !hasNumber) {
      setPasswordError("Password does not meet the security requirements.");
      return;
    }
    if (!passwordsMatch) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl -z-10">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl" />
      </div>

      {/* Return to Sign in */}
      <div className="mb-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to sign in</span>
        </Link>
      </div>

      <div className="relative w-full p-5 sm:p-7 rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl shadow-2xl glow-card animate-in fade-in-50 zoom-in-95">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" showText={false} href={null} className="mb-2" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create New Password
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Choose a strong password to secure your LinkStack account
          </p>
        </div>

        {success ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Password updated
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your password has been reset securely. You can now sign in with your new credentials.
              </p>
            </div>

            <Button
              className="w-full h-9 text-xs font-semibold gap-1.5"
              onClick={() => router.push("/login")}
            >
              Sign In to Your Account
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : !token ? (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-center space-y-3">
            <div className="flex justify-center text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-xs text-foreground font-medium">
              Missing or Invalid Reset Token
            </p>
            <p className="text-[11px] text-muted-foreground">
              Please request a fresh reset link from the forgot password page.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/forgot-password")}
              className="w-full text-xs"
            >
              Request Password Reset
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!emailParam && (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Email address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="h-9 text-xs"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground block">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                  if (formError) setFormError("");
                }}
                placeholder="Enter new password"
                required
                className={cn("h-9 text-xs", passwordError && "border-destructive focus-visible:ring-destructive")}
              />
              {passwordError && (
                <p className="text-destructive text-xs mt-1 animate-in fade-in-50">
                  {passwordError}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground block">
                  Confirm Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError("");
                  if (formError) setFormError("");
                }}
                placeholder="Confirm new password"
                required
                className={cn("h-9 text-xs", confirmPasswordError && "border-destructive focus-visible:ring-destructive")}
              />
              {confirmPasswordError && (
                <p className="text-destructive text-xs mt-1 animate-in fade-in-50">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Password Security Requirements Indicator */}
            <div className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 font-medium text-foreground pb-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Security Requirements</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <span className={hasMinLength ? "text-emerald-500 font-medium" : ""}>
                  • Min. 8 characters
                </span>
                <span className={hasNumber ? "text-emerald-500 font-medium" : ""}>
                  • One number (0-9)
                </span>
                <span className={hasLower ? "text-emerald-500 font-medium" : ""}>
                  • Lowercase letter
                </span>
                <span className={hasUpper ? "text-emerald-500 font-medium" : ""}>
                  • Uppercase letter
                </span>
              </div>
              {confirmPassword && (
                <div className="pt-0.5">
                  <span
                    className={
                      passwordsMatch
                        ? "text-emerald-500 font-medium"
                        : "text-destructive font-medium"
                    }
                  >
                    {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
                  </span>
                </div>
              )}
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium animate-in fade-in-50">
                {formError}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !hasMinLength || !hasLower || !hasUpper || !hasNumber || !passwordsMatch}
              className="w-full h-9 text-xs font-semibold gap-1.5 shadow-sm mt-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
