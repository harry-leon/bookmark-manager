"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Folder,
  Link2,
  Star,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  FileDown,
  Clock,
  ExternalLink,
  Search,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { UrlCard, UrlItem } from "@/features/urls/url-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { LandingView } from "@/components/landing/landing-view";
import { toast } from "sonner";

interface DashboardData {
  totalPackages: number;
  totalUrls: number;
  favoriteUrlsCount: number;
  recentUrls: UrlItem[];
  recentPackages: Array<{
    id: string;
    name: string;
    description?: string | null;
    color: string;
    icon: string;
    updatedAt: string;
    _count: {
      sections: number;
      urls: number;
    };
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      loadDashboard();
    }
  }, [status]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite(item: UrlItem) {
    try {
      const res = await fetch(`/api/urls/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !item.isFavorite }),
      });
      if (res.ok) {
        toast.success(item.isFavorite ? "Removed from favorites" : "Added to favorites");
        loadDashboard();
      }
    } catch {
      toast.error("Failed to update favorite");
    }
  }

  // 1. Loading state
  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="h-14 border-b border-border/50 px-6 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render public Introduction / Landing page
  if (status === "unauthenticated") {
    return <LandingView />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        onOpenNewUrl={() => window.dispatchEvent(new CustomEvent("open-new-url"))}
        onOpenNewPackage={() => window.dispatchEvent(new CustomEvent("open-new-package"))}
        onOpenCommandPalette={() =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true })
          )
        }
      />

      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full space-y-6">
        {/* Top Styled Hero Banner (aitmpl-inspired with luminous background and stats) */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card/90 via-card/70 to-card/40 p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-lg glow-card">
          {/* Ambient Radial Backlight Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[220px] bg-gradient-to-r from-blue-500/20 via-indigo-500/15 to-violet-500/20 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-3 sm:space-y-4">
            {/* Active Status Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full border border-border/80 bg-background/80 backdrop-blur-xs text-[11px] sm:text-xs font-mono text-muted-foreground shadow-2xs max-w-full truncate">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-foreground font-semibold truncate">Active Workspace</span>
              <span className="text-border hidden xs:inline">•</span>
              <span className="truncate hidden xs:inline">{session?.user?.email || "Local User"}</span>
            </div>

            {/* Stylized Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground font-mono">
              LINKSTACK
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed">
              Curated packages, sections, and bookmark collections for your development workflow.
            </p>

            {/* Metric Counters Banner (Packages, URLs, Favorites - without downloads) */}
            <div className="flex items-center justify-center gap-2 xs:gap-4 sm:gap-10 py-2.5 px-3 sm:py-3.5 sm:px-6 rounded-xl border border-border/80 bg-background/70 backdrop-blur-md shadow-xs w-full max-w-md">
              <Link href="/packages" className="group text-center flex-1">
                <div className="text-xl sm:text-3xl font-extrabold font-mono text-foreground group-hover:text-primary transition-colors">
                  {loading ? "..." : data?.totalPackages ?? 0}
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-muted-foreground group-hover:text-foreground transition-colors mt-0.5">
                  Packages
                </div>
              </Link>
              <div className="h-6 sm:h-8 w-px bg-border/60" />
              <Link href="/urls" className="group text-center flex-1">
                <div className="text-xl sm:text-3xl font-extrabold font-mono text-foreground group-hover:text-primary transition-colors">
                  {loading ? "..." : data?.totalUrls ?? 0}
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-muted-foreground group-hover:text-foreground transition-colors mt-0.5">
                  Saved URLs
                </div>
              </Link>
              <div className="h-6 sm:h-8 w-px bg-border/60" />
              <Link href="/favorites" className="group text-center flex-1">
                <div className="text-xl sm:text-3xl font-extrabold font-mono text-amber-500 group-hover:text-amber-400 transition-colors">
                  {loading ? "..." : data?.favoriteUrlsCount ?? 0}
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-muted-foreground group-hover:text-foreground transition-colors mt-0.5">
                  Favorites
                </div>
              </Link>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="flex items-center gap-1.5 sm:gap-2 pt-1 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true })
                  )
                }
                className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 border-border/80 bg-background/50 hover:bg-background px-2 sm:px-3"
              >
                <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Search (⌘K)</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent("open-new-package"))}
                className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 border-border/80 bg-background/50 hover:bg-background px-2 sm:px-3"
              >
                <Folder className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>New Package</span>
              </Button>
              <Button
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent("open-new-url"))}
                className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 shadow-sm px-2.5 sm:px-3"
              >
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Add URL (⌘N)</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Packages */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5" />
              Active Packages
            </h2>
            <Link
              href="/packages"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              View all ({data?.totalPackages ?? 0})
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          ) : data?.recentPackages.length === 0 ? (
            <EmptyState
              title="No packages created yet"
              description="Packages are top-level collections for organizing your projects and bookmarks."
              actionLabel="Create First Package"
              onAction={() => window.dispatchEvent(new CustomEvent("open-new-package"))}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {data?.recentPackages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/packages/${pkg.id}`}
                  className="group relative p-2.5 sm:p-3.5 rounded-lg border border-border/60 bg-card/40 hover:bg-card hover:border-border transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div
                        className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md shadow-xs border border-border/40"
                        style={{ backgroundColor: `${pkg.color || "#3b82f6"}20`, color: pkg.color || "#3b82f6" }}
                      >
                        <IconRenderer name={pkg.icon} className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color: pkg.color || "#3b82f6" }} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {pkg._count.urls} links
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {pkg.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {pkg.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-1.5 sm:mt-3 sm:pt-2 border-t border-border/40 flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                    <span>{pkg._count.sections} sections</span>
                    <span className="group-hover:translate-x-0.5 transition-transform text-primary font-medium">
                      Open →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recently Added URLs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Recently Added Links
            </h2>
            <Link
              href="/urls"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              Browse all links
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : data?.recentUrls.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No URLs saved yet"
              description="Save your first documentation link, GitHub repo, or API reference."
              actionLabel="Add Link"
              onAction={() => window.dispatchEvent(new CustomEvent("open-new-url"))}
            />
          ) : (
            <div className="space-y-2">
              {data?.recentUrls.map((item) => (
                <UrlCard
                  key={item.id}
                  item={item}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
