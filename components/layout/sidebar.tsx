"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Link2,
  Star,
  Plus,
  Search,
  FileDown,
  Moon,
  Sun,
  LogOut,
  Folder,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { GithubIcon } from "@/components/shared/github-icon";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

interface PackageSummary {
  id: string;
  name: string;
  color: string;
  icon: string;
  isFavorite: boolean;
  _count: {
    sections: number;
    urls: number;
  };
}

interface SidebarProps {
  onOpenNewPackage?: () => void;
  onOpenCommandPalette?: () => void;
  className?: string;
  onItemClick?: () => void;
}

export function Sidebar({
  onOpenNewPackage,
  onOpenCommandPalette,
  className,
  onItemClick,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchPackages();

    const handleRefresh = () => fetchPackages();
    window.addEventListener("refresh-packages", handleRefresh);
    return () => window.removeEventListener("refresh-packages", handleRefresh);
  }, []);

  async function fetchPackages() {
    try {
      const res = await fetch("/api/packages?sort=order");
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch {
      // ignore
    }
  }

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "All URLs", href: "/urls", icon: Link2 },
    { label: "Favorites", href: "/favorites", icon: Star },
    { label: "Import & Export", href: "/import-export", icon: FileDown },
    { label: "Giới thiệu", href: "/intro", icon: Sparkles },
  ];

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r border-border/60 bg-card/60 backdrop-blur-md px-3 py-3 select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <Link
          href="/"
          onClick={onItemClick}
          className="flex items-center gap-2 group transition-opacity hover:opacity-90"
        >
          <Logo size="sm" badge="PRO" href={null} showSubtitle={false} />
        </Link>
      </div>

      {/* Quick Search Shortcut Button */}
      <button
        onClick={onOpenCommandPalette}
        type="button"
        className="flex items-center justify-between w-full px-2.5 py-1.5 mb-3 text-xs text-muted-foreground bg-muted/40 hover:bg-muted/80 rounded-md border border-border/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          <span>Quick search...</span>
        </span>
        <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Main Navigation */}
      <div className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="my-3 h-px bg-border/40" />

      {/* Packages Section Header */}
      <div className="flex items-center justify-between px-2 mb-1.5">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80">
          Packages
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenNewPackage}
          title="New Package"
          className="h-5 w-5 rounded p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Packages List */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
        {packages.length === 0 ? (
          <div className="px-2 py-4 text-center">
            <p className="text-xs text-muted-foreground">No packages yet</p>
            <Button
              variant="link"
              size="sm"
              onClick={onOpenNewPackage}
              className="text-xs h-auto p-0 mt-1 text-primary"
            >
              + Create one
            </Button>
          </div>
        ) : (
          packages.map((pkg) => {
            const href = `/packages/${pkg.id}`;
            const isActive = pathname === href;
            return (
              <Link
                key={pkg.id}
                href={href}
                onClick={onItemClick}
                className={cn(
                  "group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: pkg.color || "#3b82f6" }}
                  />
                  <IconRenderer
                    name={pkg.icon}
                    className="h-3.5 w-3.5 shrink-0 opacity-70 group-hover:opacity-100"
                  />
                  <span className="truncate">{pkg.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-[10px] text-muted-foreground/70 font-mono px-1 rounded bg-muted/40">
                    {pkg._count.urls}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="my-2 h-px bg-border/40" />

      {/* User Session & Theme Controls */}
      <div className="pt-1 flex items-center justify-between px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-xs font-medium truncate text-foreground">
              {session?.user?.name || "Local User"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {session?.user?.email || "Ready"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <a
            href="https://github.com/harry-leon"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub: harry-leon"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <GithubIcon className="h-3.5 w-3.5" />
          </a>

          {mounted && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
              className="h-7 w-7 rounded text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
          )}

          {session?.user && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              className="h-7 w-7 rounded text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
