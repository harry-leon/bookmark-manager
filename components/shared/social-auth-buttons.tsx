"use client";

import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/shared/google-icon";
import { GithubIcon } from "@/components/shared/github-icon";
import { toast } from "sonner";

interface SocialAuthButtonsProps {
  callbackUrl?: string;
  disabled?: boolean;
}

export function SocialAuthButtons({
  callbackUrl = "/",
  disabled = false,
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "github" | null>(null);
  const [providersStatus, setProvidersStatus] = useState<{
    google: boolean;
    github: boolean;
  }>({ google: true, github: true });

  useEffect(() => {
    // Check which OAuth providers are configured in the environment
    fetch("/api/auth/providers-status")
      .then((res) => res.json())
      .then((data) => {
        setProvidersStatus(data);
      })
      .catch(() => {
        // Fallback: assume enabled
      });
  }, []);

  async function handleSocialLogin(provider: "google" | "github") {
    if (disabled || loadingProvider) return;

    const isConfigured = provider === "google" ? providersStatus.google : providersStatus.github;
    if (!isConfigured) {
      const providerName = provider === "google" ? "Google" : "GitHub";
      const envKeys =
        provider === "google"
          ? "GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET"
          : "GITHUB_ID & GITHUB_SECRET";
      toast.info(
        `${providerName} OAuth is not configured. Please add ${envKeys} to .env`,
        { duration: 5000 }
      );
      return;
    }

    try {
      setLoadingProvider(provider);
      await signIn(provider, { callbackUrl });
    } catch (err) {
      console.error(`Sign in with ${provider} failed:`, err);
      toast.error(`Sign in with ${provider === "google" ? "Google" : "GitHub"} failed.`);
      setLoadingProvider(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase">
          <span className="bg-card px-2 text-muted-foreground font-mono">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || loadingProvider !== null}
          onClick={() => handleSocialLogin("google")}
          className="h-9 px-3 text-xs font-medium border-border/80 bg-background/50 hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
        >
          {loadingProvider === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          <span>Google</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={disabled || loadingProvider !== null}
          onClick={() => handleSocialLogin("github")}
          className="h-9 px-3 text-xs font-medium border-border/80 bg-background/50 hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
        >
          {loadingProvider === "github" ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <GithubIcon className="h-4 w-4 text-foreground" />
          )}
          <span>GitHub</span>
        </Button>
      </div>
    </div>
  );
}
