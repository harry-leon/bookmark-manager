"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/logo";
import { SocialAuthButtons } from "@/components/shared/social-auth-buttons";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Simple password strength calculation
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      toast.success("Account created successfully! Signing you in...");

      // Automatically sign in
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInRes?.ok) {
        router.push("/");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg);
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

      {/* Return to Home */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="relative w-full p-5 sm:p-7 rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl shadow-2xl glow-card animate-in fade-in-50 zoom-in-95">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <Logo size="lg" showText={false} href="/" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create an Account
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Start organizing your developer URLs with LinkStack
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Your Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              autoFocus
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Email address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              className="h-9 text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-foreground block">
                Password (min 6 characters)
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-9 text-xs"
            />

            {/* Password strength bar */}
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <div
                  className={`h-1 flex-1 rounded-full transition-all ${
                    strength >= 1 ? "bg-rose-500" : "bg-muted"
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full transition-all ${
                    strength >= 2 ? "bg-amber-500" : "bg-muted"
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full transition-all ${
                    strength >= 3 ? "bg-emerald-500" : "bg-muted"
                  }`}
                />
                <span className="text-[10px] text-muted-foreground ml-1">
                  {strength === 1 ? "Weak" : strength === 2 ? "Medium" : "Strong"}
                </span>
              </div>
            )}
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
                Create Account
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </form>

        {/* Social Logins: Google & GitHub */}
        <div className="mt-4">
          <SocialAuthButtons disabled={loading} callbackUrl="/" />
        </div>

        <div className="mt-5 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
