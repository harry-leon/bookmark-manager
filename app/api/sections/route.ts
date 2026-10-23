import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sectionSchema, reorderSectionsSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = sectionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify package belongs to user
    const pkg = await db.package.findFirst({
      where: { id: result.data.packageId, userId: user.id },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Determine sortOrder
    const lastSec = await db.section.findFirst({
      where: { packageId: pkg.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = lastSec ? lastSec.sortOrder + 1 : 0;

    const newSection = await db.section.create({
      data: {
        packageId: pkg.id,
        name: result.data.name.trim(),
        description: result.data.description?.trim() || null,
        icon: result.data.icon || "FolderOpen",
        sortOrder,
      },
      include: {
        urls: true,
      },
    });

    return NextResponse.json(newSection, { status: 201 });
  } catch (err: unknown) {
    console.error("POST section error:", err);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = reorderSectionsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { packageId, sectionIds } = result.data;

    // Verify package ownership
    const pkg = await db.package.findFirst({
      where: { id: packageId, userId: user.id },
    });
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    await db.$transaction(
      sectionIds.map((id, index) =>
        db.section.updateMany({
          where: { id, packageId },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("PUT reorder sections error:", err);
    return NextResponse.json({ error: "Failed to reorder sections" }, { status: 500 });
  }
}
