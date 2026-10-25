import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Database, EyeOff, Globe } from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";

export const metadata: Metadata = {
  title: "Privacy Policy — LinkStack",
  description: "Privacy policy and data governance practices for LinkStack.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopHeader breadcrumbs={[{ label: "Privacy Policy" }]} />

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
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-mono">
            Last updated: October 2026 • Version 1.0
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <EyeOff className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Zero Third-Party Tracking</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              LinkStack does not run third-party advertising SDKs, behavioral analytics, or sell data.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Isolated User Data</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Every package, section, URL, and tag is bound strictly to your authenticated account ID.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Anti-SSRF Protected</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Metadata crawls are validated against private IP ranges and internal network addresses.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-6">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">1. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> Email address and hashed password (via bcrypt) for authentication.</li>
              <li><strong>Bookmarks & Packages:</strong> The URLs, titles, descriptions, icons, and tags you explicitly organize.</li>
              <li><strong>Usage Metrics:</strong> Local click counts and last visited timestamps to help you find your most frequented resources.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">2. Metadata Scraping Safety</h2>
            <p>
              When you paste a URL, LinkStack retrieves the title, description, and favicon using safe server-side fetching.
              Every request is filtered by DNS IP validation to prevent Server-Side Request Forgery (SSRF) and respects strict size and timeout limits.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">3. Your Choices & Data Portability</h2>
            <p>
              You own your data completely. You can export your entire collection at any time as standard Netscape Bookmark HTML (compatible with Chrome, Firefox, Safari) or JSON via the <strong>Import & Export</strong> view.
              You can also permanently delete any package, URL, or your entire account directly from the application.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">4. Changes & Open Source Transparency</h2>
            <p>
              LinkStack is fully open-source. All architectural decisions, privacy safeguards, and schema revisions are documented and audited in our public GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
