import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalPackages, totalUrls, favoriteUrlsCount, recentUrls, recentPackages] =
      await Promise.all([
        db.package.count({ where: { userId: user.id } }),
        db.url.count({ where: { userId: user.id } }),
        db.url.count({ where: { userId: user.id, isFavorite: true } }),
        db.url.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 6,
          include: {
            package: { select: { id: true, name: true, color: true, icon: true } },
            section: { select: { id: true, name: true } },
            urlTags: { include: { tag: true } },
          },
        }),
        db.package.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 4,
          include: {
            _count: {
              select: { sections: true, urls: true },
            },
          },
        }),
      ]);

    return NextResponse.json({
      totalPackages,
      totalUrls,
      favoriteUrlsCount,
      recentUrls,
      recentPackages,
    });
  } catch (err: unknown) {
    console.error("Dashboard metrics error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 });
  }
}
