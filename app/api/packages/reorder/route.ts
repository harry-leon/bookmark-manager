import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { packageMoveOrReorderSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = packageMoveOrReorderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { packageId, targetParentId, sortOrder } = result.data;

    // Verify package exists and belongs to user
    const existing = await db.package.findFirst({
      where: { id: packageId, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    let finalParentId = existing.parentId;
    if (targetParentId !== undefined) {
      if (targetParentId === null) {
        finalParentId = null;
      } else {
        if (targetParentId === packageId) {
          return NextResponse.json({ error: "Cannot nest a package inside itself" }, { status: 400 });
        }
        // Verify targetParent belongs to user
        const targetParent = await db.package.findFirst({
          where: { id: targetParentId, userId: user.id },
        });
        if (!targetParent) {
          return NextResponse.json({ error: "Target parent package not found" }, { status: 404 });
        }

        // Cycle check
        let curr: string | null = targetParent.parentId;
        const visited = new Set<string>([targetParent.id]);
        while (curr) {
          if (curr === packageId) {
            return NextResponse.json(
              { error: "Circular hierarchy detected" },
              { status: 400 }
            );
          }
          if (visited.has(curr)) break;
          visited.add(curr);
          const ancestor: { parentId: string | null } | null = await db.package.findFirst({
            where: { id: curr, userId: user.id },
            select: { parentId: true },
          });
          curr = ancestor?.parentId || null;
        }

        finalParentId = targetParent.id;
      }
    }

    const updated = await db.package.update({
      where: { id: packageId },
      data: {
        parentId: finalParentId,
        ...(typeof sortOrder === "number" ? { sortOrder } : {}),
      },
      include: {
        children: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
    });

    return NextResponse.json({ success: true, package: updated });
  } catch (err: unknown) {
    console.error("POST /api/packages/reorder error:", err);
    return NextResponse.json({ error: "Failed to reorder or move package" }, { status: 500 });
  }
}
