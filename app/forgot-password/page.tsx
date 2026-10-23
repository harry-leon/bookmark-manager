"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Mail, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/logo";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setSubmitted(true);
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
      toast.success("Password reset request sent");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
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
            Forgot Password
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your account email to receive a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">
                Check your inbox
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                If an account with <span className="font-semibold text-foreground">{email}</span> exists, we have sent instructions to reset your password. The link will expire in 1 hour.
              </p>
            </div>

            {/* Development Mode Quick Link */}
            {devResetUrl && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-left space-y-2">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Development Shortcut</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  In local dev mode, you can immediately continue with your generated token:
                </p>
                <Link
                  href={devResetUrl}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline break-all"
                >
                  <span>Open Reset Password Page</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitted(false);
                setDevResetUrl(null);
              }}
              className="w-full text-xs"
            >
              Send another link
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Email address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                  className="h-9 text-xs pl-8"
                />
                <Mail className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 text-xs font-semibold gap-1.5 shadow-sm mt-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-1">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
