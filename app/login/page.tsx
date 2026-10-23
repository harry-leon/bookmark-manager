"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, ArrowLeft, Loader2, Sparkles, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/logo";
import { SocialAuthButtons } from "@/components/shared/social-auth-buttons";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      if (error === "OAuthCallback" || error === "OAuthSignin") {
        toast.error("Could not connect to sign in provider. Please try again.");
      } else if (error === "OAuthAccountNotLinked") {
        toast.error("This email is already associated with another sign in method.");
      } else if (error === "AccessDenied") {
        toast.error("Access denied.");
      } else {
        toast.error("Sign in error: " + error);
      }
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back!");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred during sign in");
    } finally {
      setLoading(false);
    }
  }

  function handleFillDemo() {
    setEmail("demo@linkstack.app");
    setPassword("Password123!");
    toast.info("Filled demo credentials");
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

      <div className="relative w-full p-3.5 xs:p-5 sm:p-7 rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl shadow-2xl glow-card animate-in fade-in-50 zoom-in-95">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <Logo size="lg" showText={false} href="/" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Welcome to LinkStack
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in to manage and organize your URLs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
              autoFocus
              className="h-9 text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-foreground block">
                Password
              </label>
              <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
                <Link
                  href="/forgot-password"
                  className="text-primary hover:underline font-medium"
                  tabIndex={-1}
                >
                  <span className="xs:hidden">Forgot?</span>
                  <span className="hidden xs:inline">Forgot password?</span>
                </Link>
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
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-9 text-xs"
            />
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
                Sign In
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </form>

        {/* Social Logins: Google & GitHub */}
        <div className="mt-4">
          <SocialAuthButtons disabled={loading} callbackUrl="/" />
        </div>

        {/* Demo Credentials Quick Button */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-amber-500 dark:text-amber-400 text-xs font-medium transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Fill with Demo Account</span>
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-foreground font-medium underline-offset-4 hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-xs text-muted-foreground">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
