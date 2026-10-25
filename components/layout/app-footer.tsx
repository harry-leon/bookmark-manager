"use client";

import React from "react";
import Link from "next/link";
import { GithubIcon } from "@/components/shared/github-icon";
import { Logo } from "@/components/shared/logo";

interface AppFooterProps {
  className?: string;
}

export function AppFooter({ className = "" }: AppFooterProps) {
  return (
    <footer className={`mt-auto py-8 px-4 sm:px-6 lg:px-8 border-t border-border/40 text-xs text-muted-foreground bg-background/50 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Copyright */}
        <div className="flex items-center gap-2">
          <Logo size="sm" showText={false} href={null} />
          <span className="font-mono text-[11px] text-muted-foreground/70">
            © 2026 LinkStack. Open source bookmark manager.
          </span>
        </div>

        {/* Right: Clean minimalist links (matching reference design without sponsors/support) */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap justify-center sm:justify-end">
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/intro" className="hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="/api/dashboard" className="hover:text-foreground transition-colors">
            API
          </Link>
          <a
            href="https://github.com/harry-leon"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            title="GitHub: harry-leon"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
