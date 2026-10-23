import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(`search:${user.id}`, 40, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Search rate limit reached. Try again in ${rl.resetIn}s.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get("q")?.trim() || "";
    // Bound query length to 200 characters max
    const q = rawQ.slice(0, 200);

    if (!q) {
      // Return recent URLs, packages, notes, tasks if query is empty
      const [recentUrls, packages, recentNotes, recentTasks] = await Promise.all([
        db.url.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 6,
          include: {
            package: { select: { id: true, name: true, color: true } },
            section: { select: { id: true, name: true } },
          },
        }),
        db.package.findMany({
          where: { userId: user.id },
          orderBy: { sortOrder: "asc" },
          take: 6,
          select: { id: true, name: true, icon: true, color: true },
        }),
        db.note.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 4,
          select: { id: true, title: true, content: true, urlId: true },
        }),
        db.task.findMany({
          where: { userId: user.id, status: { not: "DONE" } },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
          take: 4,
          select: { id: true, title: true, status: true, priority: true, dueAt: true },
        }),
      ]);

      return NextResponse.json({
        packages,
        sections: [],
        urls: recentUrls,
        tags: [],
        notes: recentNotes,
        tasks: recentTasks,
      });
    }

    const [matchedPackages, matchedSections, matchedUrls, matchedTags, matchedNotes, matchedTasks] =
      await Promise.all([
        // 1. Packages
        db.package.findMany({
          where: {
            userId: user.id,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            color: true,
          },
        }),

        // 2. Sections
        db.section.findMany({
          where: {
            package: { userId: user.id },
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: {
            package: { select: { id: true, name: true, color: true } },
          },
        }),

        // 3. URLs
        db.url.findMany({
          where: {
            userId: user.id,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { url: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              {
                urlTags: {
                  some: {
                    tag: {
                      name: { contains: q, mode: "insensitive" },
                    },
                  },
                },
              },
            ],
          },
          take: 12,
          include: {
            package: { select: { id: true, name: true, color: true } },
            section: { select: { id: true, name: true } },
            urlTags: { include: { tag: true } },
          },
        }),

        // 4. Tags
        db.tag.findMany({
          where: {
            userId: user.id,
            name: { contains: q, mode: "insensitive" },
          },
          take: 6,
          include: {
            _count: {
              select: { urlTags: true },
            },
          },
        }),

        // 5. Notes (title or content)
        db.note.findMany({
          where: {
            userId: user.id,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 6,
          select: {
            id: true,
            title: true,
            content: true,
            urlId: true,
            updatedAt: true,
            url: { select: { id: true, title: true, url: true } },
          },
        }),

        // 6. Tasks (title or description)
        db.task.findMany({
          where: {
            userId: user.id,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 6,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueAt: true,
          },
        }),
      ]);

    return NextResponse.json({
      packages: matchedPackages,
      sections: matchedSections,
      urls: matchedUrls,
      tags: matchedTags,
      notes: matchedNotes,
      tasks: matchedTasks,
    });
  } catch (err: unknown) {
    console.error("Global search error:", err);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
