import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { exportToNetscapeHtml } from "@/lib/bookmarks-parser";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const [packages, tags, notes, tasks] = await Promise.all([
      db.package.findMany({
        where: { userId: user.id },
        orderBy: { sortOrder: "asc" },
        include: {
          sections: {
            orderBy: { sortOrder: "asc" },
            include: {
              urls: {
                orderBy: { sortOrder: "asc" },
                include: {
                  urlTags: { include: { tag: true } },
                },
              },
            },
          },
          urls: {
            where: { sectionId: null },
            orderBy: { sortOrder: "asc" },
            include: {
              urlTags: { include: { tag: true } },
            },
          },
        },
      }),

      db.tag.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
      }),

      db.note.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          attachments: {
            select: {
              id: true,
              originalFilename: true,
              mimeType: true,
              sizeBytes: true,
              width: true,
              height: true,
              createdAt: true,
            },
          },
          url: { select: { id: true, url: true, title: true } },
        },
      }),

      db.task.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          package: { select: { id: true, name: true } },
          url:     { select: { id: true, title: true, url: true } },
        },
      }),
    ]);

    if (format === "html") {
      const htmlContent = exportToNetscapeHtml(packages);
      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": 'attachment; filename="linknest-bookmarks.html"',
        },
      });
    }

    if (format === "backup" || format === "linknest" || searchParams.get("backup") === "true") {
      const backupData = {
        app: "LinkNest",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        packages,
        tags,
        notes,
        tasks,
      };

      return new NextResponse(JSON.stringify(backupData, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": 'attachment; filename="linknest-backup.json"',
        },
      });
    }

    // Default JSON export: returns packages array for compatibility with tests & bookmark engines
    return new NextResponse(JSON.stringify(packages, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="linknest-export.json"',
      },
    });

  } catch (err: unknown) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
