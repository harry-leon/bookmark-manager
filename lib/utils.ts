import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(urlString: string): string {
  let trimmed = urlString.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.href;
  } catch {
    return trimmed;
  }
}

export function getDomain(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return urlString;
  }
}

export function getFallbackFavicon(urlString: string): string {
  try {
    const domain = getDomain(urlString);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "";
  }
}
