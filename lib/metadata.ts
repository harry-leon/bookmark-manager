import * as cheerio from "cheerio";
import { safeFetchHtml } from "./ssrf";
import { getDomain, getFallbackFavicon } from "./utils";
import { metadataCache } from "./cache";

export interface UrlMetadata {
  title: string;
  description: string;
  faviconUrl: string;
}

/**
 * Strips HTML tags, trims excessive whitespace, and eliminates control characters.
 */
function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Strip non-printable control characters
    .replace(/\s+/g, " ")
    .trim();
}

export async function extractMetadata(rawUrl: string): Promise<UrlMetadata> {
  const domain = getDomain(rawUrl);
  const fallback: UrlMetadata = {
    title: domain,
    description: "",
    faviconUrl: getFallbackFavicon(rawUrl),
  };

  // Check cache first for instant sub-millisecond retrieval
  const cached = metadataCache.get(rawUrl);
  if (cached) {
    return cached as UrlMetadata;
  }

  try {
    const html = await safeFetchHtml(rawUrl);
    if (!html) {
      return fallback;
    }

    const $ = cheerio.load(html);

    // 1. Extract title
    let title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text().trim() ||
      $('meta[name="title"]').attr("content") ||
      domain;

    title = sanitizeText(title);
    if (title.length > 200) {
      title = title.substring(0, 197) + "...";
    }

    // 2. Extract description
    let description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    description = sanitizeText(description);
    if (description.length > 500) {
      description = description.substring(0, 497) + "...";
    }

    // 3. Extract favicon
    let faviconUrl =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      $('link[rel="apple-touch-icon-precomposed"]').attr("href") ||
      "";

    if (faviconUrl) {
      faviconUrl = faviconUrl.trim();
      // Handle relative URLs
      if (faviconUrl.startsWith("//")) {
        faviconUrl = "https:" + faviconUrl;
      } else if (faviconUrl.startsWith("/")) {
        try {
          const origin = new URL(rawUrl).origin;
          faviconUrl = origin + faviconUrl;
        } catch {
          faviconUrl = getFallbackFavicon(rawUrl);
        }
      } else if (!/^https?:\/\//i.test(faviconUrl)) {
        try {
          const baseUrl = new URL(rawUrl);
          faviconUrl = new URL(faviconUrl, baseUrl).href;
        } catch {
          faviconUrl = getFallbackFavicon(rawUrl);
        }
      }
    } else {
      faviconUrl = getFallbackFavicon(rawUrl);
    }

    const result: UrlMetadata = {
      title: title || domain,
      description: description || "",
      faviconUrl: faviconUrl || getFallbackFavicon(rawUrl),
    };

    // Store in cache for 15 minutes
    metadataCache.set(rawUrl, result);

    return result;
  } catch {
    return fallback;
  }
}

