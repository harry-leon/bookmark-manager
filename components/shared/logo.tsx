"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showSubtitle?: boolean;
  href?: string | null;
  className?: string;
  badge?: string;
}

const sizeConfig = {
  xs: { icon: 20, text: "text-xs", subtitle: "text-[9px]" },
  sm: { icon: 28, text: "text-sm", subtitle: "text-[10px]" },
  md: { icon: 34, text: "text-base", subtitle: "text-[11px]" },
  lg: { icon: 44, text: "text-lg", subtitle: "text-xs" },
  xl: { icon: 56, text: "text-2xl", subtitle: "text-sm" },
};

export function Logo({
  size = "md",
  showText = true,
  showSubtitle = false,
  href = "/",
  className,
  badge,
}: LogoProps) {
  const cfg = sizeConfig[size] || sizeConfig.md;

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none group", className)}>
      <div
        className="relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-sm transition-transform group-hover:scale-105"
        style={{ width: cfg.icon, height: cfg.icon }}
      >
        <Image
          src="/logo-icon.png"
          alt="LinkStack Logo"
          width={cfg.icon * 2}
          height={cfg.icon * 2}
          priority={size === "lg" || size === "xl"}
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-bold tracking-tight text-foreground transition-colors group-hover:text-primary",
                cfg.text
              )}
            >
              LinkStack
            </span>
            {badge && (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold leading-none">
                {badge}
              </span>
            )}
          </div>
          {showSubtitle && (
            <span className={cn("text-muted-foreground", cfg.subtitle)}>
              Save • Organize • Access
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
