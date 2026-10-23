import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseNetscapeBookmarks } from "@/lib/bookmarks-parser";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { htmlContent } = await req.json();
    if (!htmlContent || typeof htmlContent !== "string") {
      return NextResponse.json({ error: "htmlContent is required" }, { status: 400 });
    }

    // Security check: limit content size to 10MB
    if (htmlContent.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    const preview = parseNetscapeBookmarks(htmlContent);

    // Collect all URLs to check for duplicates in user's DB
    const allUrls: string[] = [];
    for (const pkg of preview.packages) {
      for (const u of pkg.directUrls) {
        allUrls.push(u.url);
      }
      for (const sec of pkg.sections) {
        for (const u of sec.urls) {
          allUrls.push(u.url);
        }
      }
    }

    const existingInDb = await db.url.findMany({
      where: {
        userId: user.id,
        url: { in: allUrls },
      },
      select: { url: true },
    });

    const existingUrlSet = new Set(existingInDb.map((u) => u.url));

    return NextResponse.json({
      preview,
      duplicatesCount: existingUrlSet.size,
    });
  } catch (err: unknown) {
    console.error("Import preview error:", err);
    return NextResponse.json({ error: "Failed to parse bookmark file" }, { status: 500 });
  }
}
