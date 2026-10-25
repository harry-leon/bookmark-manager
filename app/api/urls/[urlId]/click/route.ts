import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ urlId: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { urlId } = await params;

    const existing = await db.url.findFirst({
      where: { id: urlId, userId: user.id },
      select: { id: true, clickCount: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    const updated = await db.url.update({
      where: { id: urlId },
      data: {
        clickCount: { increment: 1 },
        lastVisitedAt: new Date(),
      },
      select: {
        id: true,
        clickCount: true,
        lastVisitedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("POST /api/urls/[urlId]/click error:", err);
    return NextResponse.json({ error: "Failed to record URL click" }, { status: 500 });
  }
}
