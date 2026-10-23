import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Layers, Zap, Shield, Sparkles, Folder, ExternalLink } from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { GithubIcon } from "@/components/shared/github-icon";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About LinkStack — Package URL Manager",
  description: "Learn more about LinkStack's architecture, mission, and productivity design philosophy.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopHeader breadcrumbs={[{ label: "About" }]} />

      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            About LinkStack
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            A developer-first, high-velocity bookmark manager organized by Packages and Sections.
          </p>
        </div>

        {/* Philosophy Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Structured 3-Tier Hierarchy</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Inspired by CtrlTAB: Organize resources into <strong>Package → Sections → URLs</strong> with instant drag-and-drop.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Zap className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Sub-millisecond Speed</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Command Palette (⌘K), in-memory TTL caching, optimistic UI updates, and sub-88 kB JS bundles.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Shield className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Enterprise Security</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              OWASP anti-SSRF DNS resolution filtering, Content-Security-Policy headers, and strict user session boundary checks.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-6">
          <h2 className="text-sm font-bold text-foreground">Open Source & Community</h2>
          <p>
            LinkStack is built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Prisma ORM.
            Created by developer <strong>harry-leon</strong> to eliminate bookmark clutter and empower developer productivity.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <a
              href="https://github.com/harry-leon"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8">
                <GithubIcon className="h-3.5 w-3.5" />
                <span>Visit GitHub Profile</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
