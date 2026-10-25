"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, HardDrive, Keyboard, Sun, Moon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TopHeaderAction {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
}

interface TopHeaderProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  action?: TopHeaderAction | null;
  onOpenNewUrl?: () => void;
  onOpenNewPackage?: () => void;
  onOpenCommandPalette?: () => void;
}

export function TopHeader({
  breadcrumbs = [{ label: "Dashboard" }],
  action,
  onOpenNewUrl,
  onOpenNewPackage,
  onOpenCommandPalette,
}: TopHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const primaryAction = action !== undefined
    ? action
    : onOpenNewUrl
    ? { label: "Add URL", onClick: onOpenNewUrl, icon: Plus }
    : null;

  const ActionIcon = primaryAction?.icon || Plus;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-2.5 sm:px-4 md:px-6 backdrop-blur-md gap-2">
      {/* Left: Mobile Menu + Breadcrumbs */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden h-8 w-8 text-muted-foreground shrink-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r">
            <Sidebar
              onOpenNewPackage={() => {
                setMobileOpen(false);
                onOpenNewPackage?.();
              }}
              onOpenCommandPalette={() => {
                setMobileOpen(false);
                onOpenCommandPalette?.();
              }}
              onItemClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 text-xs min-w-0">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const isFirst = idx === 0;
            // On very small screens, if multiple crumbs, hide intermediate crumbs
            const hideOnMobile = breadcrumbs.length > 2 && !isLast && !isFirst;

            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <ChevronRight className={cn(
                    "h-3 w-3 text-muted-foreground/50 shrink-0",
                    hideOnMobile && "hidden sm:inline"
                  )} />
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className={cn(
                      "text-muted-foreground hover:text-foreground transition-colors font-medium truncate max-w-[80px] xs:max-w-[110px] sm:max-w-none",
                      hideOnMobile && "hidden sm:inline"
                    )}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Search + Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCommandPalette}
          className="hidden sm:flex h-8 items-center gap-2 px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            size="sm"
            className="h-8 gap-1 sm:gap-1.5 px-2 sm:px-3 text-xs font-medium shadow-xs"
          >
            <ActionIcon className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">{primaryAction.label}</span>
          </Button>
        )}

        {/* User Account Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs border border-primary/30 hover:opacity-90 transition-opacity cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title="Account & Settings"
            >
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg border border-border/80">
            <div className="px-2 py-1.5 mb-1 bg-muted/40 rounded-md">
              <p className="text-xs font-semibold text-foreground truncate">{session?.user?.name || "User"}</p>
              <p className="text-[11px] text-muted-foreground truncate font-mono">{session?.user?.email}</p>
            </div>

            <DropdownMenuItem asChild>
              <Link href="/settings?tab=profile" className="flex items-center gap-2 cursor-pointer text-xs">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/settings?tab=quota" className="flex items-center gap-2 cursor-pointer text-xs">
                <HardDrive className="h-3.5 w-3.5 text-primary" />
                <span>Storage & Quotas</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/settings?tab=shortcuts" className="flex items-center gap-2 cursor-pointer text-xs">
                <Keyboard className="h-3.5 w-3.5 text-primary" />
                <span>Keyboard Shortcuts</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {mounted && (
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-2 cursor-pointer text-xs"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Dark Mode</span>
                  </>
                )}
              </DropdownMenuItem>
            )}

            {session?.user && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
