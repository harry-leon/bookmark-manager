"use client";

import React, { useState } from "react";
import { Globe } from "lucide-react";
import { getDomain, getFallbackFavicon } from "@/lib/utils";

interface FaviconImageProps {
  url: string;
  faviconUrl?: string | null;
  title: string;
  className?: string;
  size?: number;
}

export function FaviconImage({
  url,
  faviconUrl,
  title,
  className = "h-4 w-4 rounded-sm object-contain",
  size = 16,
}: FaviconImageProps) {
  const [errorStage, setErrorStage] = useState<number>(0);
  // errorStage:
  // 0: Try custom faviconUrl if present, else fallback
  // 1: Try Google Favicon Service fallback
  // 2: Fallback to Lucide Globe icon

  const domain = getDomain(url);
  const initialSrc = faviconUrl || getFallbackFavicon(url);

  if (errorStage >= 2 || !initialSrc) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground"
        style={{ width: size, height: size }}
        title={title || domain}
      >
        <Globe className="h-3 w-3 stroke-[1.5]" />
      </div>
    );
  }

  const currentSrc = errorStage === 0 ? initialSrc : getFallbackFavicon(url);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={title || domain}
      className={className}
      width={size}
      height={size}
      loading="lazy"
      onError={() => {
        setErrorStage((prev) => prev + 1);
      }}
    />
  );
}
