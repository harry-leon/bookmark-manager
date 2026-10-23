import { describe, it, expect } from "vitest";
import { parseNetscapeBookmarks, exportToNetscapeHtml } from "@/lib/bookmarks-parser";

const SAMPLE_NETSCAPE_HTML = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1600000000">Engineering</H3>
    <DL><p>
        <DT><A HREF="https://github.com" ADD_DATE="1600000001">GitHub</A>
        <DT><H3 ADD_DATE="1600000002">Backend</H3>
        <DL><p>
            <DT><A HREF="https://spring.io" ADD_DATE="1600000003">Spring</A>
            <DT><A HREF="https://postgresql.org" ADD_DATE="1600000004">Postgres</A>
        </DL><p>
    </DL><p>
    <DT><A HREF="https://news.ycombinator.com">Hacker News</A>
</DL><p>
`;

describe("Netscape Bookmark Parser & Exporter", () => {
  it("should parse top-level folder as package and subfolder as section", () => {
    const result = parseNetscapeBookmarks(SAMPLE_NETSCAPE_HTML);

    expect(result.totalPackages).toBeGreaterThanOrEqual(1);

    const engPkg = result.packages.find((p) => p.name === "Engineering");
    expect(engPkg).toBeDefined();

    // Check direct URL inside package
    expect(engPkg?.directUrls.some((u) => u.url === "https://github.com")).toBe(true);

    // Check section
    const backendSection = engPkg?.sections.find((s) => s.name === "Backend");
    expect(backendSection).toBeDefined();
    expect(backendSection?.urls.some((u) => u.url === "https://spring.io")).toBe(true);
    expect(backendSection?.urls.some((u) => u.url === "https://postgresql.org")).toBe(true);

    // Check uncategorized direct URL
    const uncat = result.packages.find((p) => p.name === "Uncategorized");
    expect(uncat?.directUrls.some((u) => u.url === "https://news.ycombinator.com")).toBe(true);
  });

  it("should export packages and sections to valid Netscape bookmark HTML format", () => {
    const packages = [
      {
        name: "My Dev Links",
        sections: [
          {
            name: "React Docs",
            urls: [
              {
                title: "React Official",
                url: "https://react.dev",
                faviconUrl: "https://react.dev/favicon.ico",
              },
            ],
          },
        ],
        urls: [
          {
            title: "Next.js",
            url: "https://nextjs.org",
          },
        ],
      },
    ];

    const html = exportToNetscapeHtml(packages);
    expect(html).toContain("<!DOCTYPE NETSCAPE-Bookmark-file-1>");
    expect(html).toContain("<H3>My Dev Links</H3>");
    expect(html).toContain("<H3>React Docs</H3>");
    expect(html).toContain('HREF="https://react.dev"');
    expect(html).toContain('HREF="https://nextjs.org"');
  });
});
