import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { packageSchema } from "@/lib/validations";

export async function GET(
  req: Request,
  { params }: { params: { packageId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pkg = await db.package.findFirst({
      where: {
        id: params.packageId,
        userId: user.id,
      },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: {
            urls: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
              include: {
                urlTags: {
                  include: { tag: true },
                },
              },
            },
          },
        },
        urls: {
          where: { sectionId: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          include: {
            urlTags: {
              include: { tag: true },
            },
          },
        },
        _count: {
          select: {
            sections: true,
            urls: true,
          },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(pkg);
  } catch (err: unknown) {
    console.error("GET package error:", err);
    return NextResponse.json({ error: "Failed to fetch package" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { packageId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = packageSchema.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db.package.findFirst({
      where: { id: params.packageId, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    let targetParentId = existing.parentId;
    if (result.data.parentId !== undefined) {
      if (result.data.parentId === null) {
        targetParentId = null;
      } else {
        if (result.data.parentId === params.packageId) {
          return NextResponse.json(
            { error: "A package cannot be its own parent" },
            { status: 400 }
          );
        }

        // Verify parent exists and belongs to user
        const targetParent = await db.package.findFirst({
          where: { id: result.data.parentId, userId: user.id },
        });
        if (!targetParent) {
          return NextResponse.json({ error: "Target parent package not found" }, { status: 404 });
        }

        // Cycle check: verify targetParent is not currently a descendant of this package
        let currentCheckId: string | null = targetParent.parentId;
        const visited = new Set<string>([targetParent.id]);
        while (currentCheckId) {
          if (currentCheckId === params.packageId) {
            return NextResponse.json(
              { error: "Cannot move package into its own child (circular reference)" },
              { status: 400 }
            );
          }
          if (visited.has(currentCheckId)) break;
          visited.add(currentCheckId);
          const ancestor: { parentId: string | null } | null = await db.package.findFirst({
            where: { id: currentCheckId, userId: user.id },
            select: { parentId: true },
          });
          currentCheckId = ancestor?.parentId || null;
        }

        targetParentId = targetParent.id;
      }
    }

    const updated = await db.package.update({
      where: { id: params.packageId },
      data: {
        ...(result.data.name !== undefined && { name: result.data.name.trim() }),
        ...(result.data.description !== undefined && { description: result.data.description?.trim() || null }),
        ...(result.data.icon !== undefined && { icon: result.data.icon }),
        ...(result.data.color !== undefined && { color: result.data.color }),
        ...(result.data.isFavorite !== undefined && { isFavorite: result.data.isFavorite }),
        parentId: targetParentId,
      },
      include: {
        children: {
          select: { id: true, name: true, color: true, icon: true },
        },
        _count: {
          select: {
            sections: true,
            urls: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("PATCH package error:", err);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { packageId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.package.findFirst({
      where: { id: params.packageId, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Cascade deletes sections and urls because of schema onDelete: Cascade
    await db.package.delete({
      where: { id: params.packageId },
    });

    return NextResponse.json({ message: "Package deleted successfully" });
  } catch (err: unknown) {
    console.error("DELETE package error:", err);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
