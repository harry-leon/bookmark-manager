import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeUrl } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ isDuplicate: false });
    }

    const normalized = normalizeUrl(url);

    const existing = await db.url.findFirst({
      where: {
        userId: user.id,
        url: normalized,
      },
      include: {
        package: { select: { id: true, name: true, color: true } },
        section: { select: { id: true, name: true } },
      },
    });

    if (existing) {
      return NextResponse.json({
        isDuplicate: true,
        existing: {
          id: existing.id,
          title: existing.title,
          packageName: existing.package.name,
          sectionName: existing.section?.name || null,
        },
      });
    }

    return NextResponse.json({ isDuplicate: false });
  } catch (err: unknown) {
    console.error("Duplicate check error:", err);
    return NextResponse.json({ isDuplicate: false });
  }
}
