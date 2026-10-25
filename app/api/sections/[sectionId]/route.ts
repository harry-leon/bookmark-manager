import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sectionSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: { sectionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = sectionSchema.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify section belongs to a package owned by user
    const section = await db.section.findFirst({
      where: {
        id: params.sectionId,
        package: { userId: user.id },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const updated = await db.section.update({
      where: { id: params.sectionId },
      data: {
        ...(result.data.name !== undefined && { name: result.data.name.trim() }),
        ...(result.data.description !== undefined && { description: result.data.description?.trim() || null }),
        ...(result.data.icon !== undefined && { icon: result.data.icon }),
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("PATCH section error:", err);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { sectionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deleteUrls = searchParams.get("deleteUrls") === "true";

    const section = await db.section.findFirst({
      where: {
        id: params.sectionId,
        package: { userId: user.id },
      },
      include: {
        package: true,
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    if (deleteUrls) {
      // Delete all URLs inside this section
      await db.url.deleteMany({
        where: { sectionId: section.id, userId: user.id },
      });
    } else {
      // Move URLs to package level by unsetting sectionId
      await db.url.updateMany({
        where: { sectionId: section.id, userId: user.id },
        data: { sectionId: null },
      });
    }

    await db.section.delete({
      where: { id: section.id },
    });

    return NextResponse.json({
      message: deleteUrls
        ? "Section and its URLs were deleted"
        : "Section deleted, URLs preserved in package",
    });
  } catch (err: unknown) {
    console.error("DELETE section error:", err);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
