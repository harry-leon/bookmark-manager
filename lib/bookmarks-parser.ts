import * as cheerio from "cheerio";

export interface ParsedBookmarkUrl {
  url: string;
  title: string;
  faviconUrl?: string;
  addDate?: string;
}

export interface ParsedSection {
  name: string;
  urls: ParsedBookmarkUrl[];
}

export interface ParsedPackage {
  name: string;
  sections: ParsedSection[];
  directUrls: ParsedBookmarkUrl[];
}

export interface BookmarkImportPreview {
  packages: ParsedPackage[];
  totalPackages: number;
  totalSections: number;
  totalUrls: number;
}

/**
 * Parses Netscape Bookmark HTML into structured Packages, Sections, and URLs.
 */
export function parseNetscapeBookmarks(htmlContent: string): BookmarkImportPreview {
  const $ = cheerio.load(htmlContent);
  const packages: ParsedPackage[] = [];

  // Helper to extract links from a DL node
  function extractLinksFromDl(dlElement: cheerio.Cheerio<any>): ParsedBookmarkUrl[] {
    const urls: ParsedBookmarkUrl[] = [];
    dlElement.children("dt").each((_, dt) => {
      const $dt = $(dt);
      const $a = $dt.children("a");
      if ($a.length > 0) {
        const href = $a.attr("href")?.trim();
        const title = $a.text().trim() || href || "Untitled";
        const icon = $a.attr("icon") || undefined;
        const addDate = $a.attr("add_date") || undefined;
        if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
          urls.push({
            url: href,
            title,
            faviconUrl: icon,
            addDate,
          });
        }
      }
    });
    return urls;
  }

  // Find the root DL
  let $rootDl = $("dl").first();
  if ($rootDl.length === 0) {
    // If no DL, check if there are flat A tags
    const flatUrls: ParsedBookmarkUrl[] = [];
    $("a").each((_, a) => {
      const $a = $(a);
      const href = $a.attr("href")?.trim();
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        flatUrls.push({
          url: href,
          title: $a.text().trim() || href,
          faviconUrl: $a.attr("icon"),
        });
      }
    });
    if (flatUrls.length > 0) {
      packages.push({
        name: "Imported Bookmarks",
        sections: [],
        directUrls: flatUrls,
      });
    }
    return {
      packages,
      totalPackages: packages.length,
      totalSections: 0,
      totalUrls: flatUrls.length,
    };
  }

  // Iterate top-level DTs
  $rootDl.children("dt").each((_, dt) => {
    const $dt = $(dt);
    const $h3 = $dt.children("h3");

    if ($h3.length > 0) {
      // Top-level folder -> Package
      const packageName = $h3.text().trim() || "Imported Package";
      const $subDl = $dt.children("dl");
      const subSections: ParsedSection[] = [];
      const directUrls: ParsedBookmarkUrl[] = [];

      if ($subDl.length > 0) {
        $subDl.children("dt").each((_, subDt) => {
          const $sdt = $(subDt);
          const $subH3 = $sdt.children("h3");
          if ($subH3.length > 0) {
            // Nested folder -> Section
            const sectionName = $subH3.text().trim() || "General";
            const $sectionDl = $sdt.children("dl");
            const sectionUrls = $sectionDl.length > 0 ? extractLinksFromDl($sectionDl) : [];
            subSections.push({
              name: sectionName,
              urls: sectionUrls,
            });
          } else {
            // Direct link inside package
            const $a = $sdt.children("a");
            if ($a.length > 0) {
              const href = $a.attr("href")?.trim();
              if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
                directUrls.push({
                  url: href,
                  title: $a.text().trim() || href,
                  faviconUrl: $a.attr("icon"),
                });
              }
            }
          }
        });
      }

      packages.push({
        name: packageName,
        sections: subSections,
        directUrls,
      });
    } else {
      // Top-level link without folder
      const $a = $dt.children("a");
      if ($a.length > 0) {
        const href = $a.attr("href")?.trim();
        if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
          let generalPackage = packages.find((p) => p.name === "Uncategorized");
          if (!generalPackage) {
            generalPackage = { name: "Uncategorized", sections: [], directUrls: [] };
            packages.push(generalPackage);
          }
          generalPackage.directUrls.push({
            url: href,
            title: $a.text().trim() || href,
            faviconUrl: $a.attr("icon"),
          });
        }
      }
    }
  });

  // Calculate totals
  let totalSections = 0;
  let totalUrls = 0;
  for (const pkg of packages) {
    totalSections += pkg.sections.length;
    totalUrls += pkg.directUrls.length;
    for (const sec of pkg.sections) {
      totalUrls += sec.urls.length;
    }
  }

  return {
    packages,
    totalPackages: packages.length,
    totalSections,
    totalUrls,
  };
}

/**
 * Exports all packages, sections, and URLs into standard Netscape Bookmark HTML.
 */
export function exportToNetscapeHtml(
  packages: Array<{
    name: string;
    description?: string | null;
    sections: Array<{
      name: string;
      urls: Array<{
        title: string;
        url: string;
        faviconUrl?: string | null;
        createdAt?: Date | string;
      }>;
    }>;
    urls: Array<{
      title: string;
      url: string;
      faviconUrl?: string | null;
      createdAt?: Date | string;
    }>;
  }>
): string {
  const lines: string[] = [
    `<!DOCTYPE NETSCAPE-Bookmark-file-1>`,
    `<!-- This is an automatically generated file. -->`,
    `<!-- It will be read and overwritten. -->`,
    `<!-- DO NOT EDIT! -->`,
    `<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">`,
    `<TITLE>Bookmarks</TITLE>`,
    `<H1>Bookmarks</H1>`,
    `<DL><p>`,
  ];

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  for (const pkg of packages) {
    lines.push(`    <DT><H3>${escapeHtml(pkg.name)}</H3>`);
    lines.push(`    <DL><p>`);

    // Direct Package URLs
    for (const item of pkg.urls) {
      const iconAttr = item.faviconUrl ? ` ICON="${escapeHtml(item.faviconUrl)}"` : "";
      const date = item.createdAt ? Math.floor(new Date(item.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
      lines.push(`        <DT><A HREF="${escapeHtml(item.url)}" ADD_DATE="${date}"${iconAttr}>${escapeHtml(item.title)}</A>`);
    }

    // Sections
    for (const sec of pkg.sections) {
      lines.push(`        <DT><H3>${escapeHtml(sec.name)}</H3>`);
      lines.push(`        <DL><p>`);
      for (const item of sec.urls) {
        const iconAttr = item.faviconUrl ? ` ICON="${escapeHtml(item.faviconUrl)}"` : "";
        const date = item.createdAt ? Math.floor(new Date(item.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
        lines.push(`            <DT><A HREF="${escapeHtml(item.url)}" ADD_DATE="${date}"${iconAttr}>${escapeHtml(item.title)}</A>`);
      }
      lines.push(`        </DL><p>`);
    }

    lines.push(`    </DL><p>`);
  }

  lines.push(`</DL><p>`);
  return lines.join("\n");
}
