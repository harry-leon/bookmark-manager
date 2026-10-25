import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { packageSchema, reorderPackagesSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") || "order"; // 'order' | 'name' | 'created'
    const favoriteOnly = searchParams.get("favorite") === "true";

    let orderBy: any = [{ sortOrder: "asc" }, { createdAt: "asc" }];
    if (sort === "name") {
      orderBy = [{ name: "asc" }];
    } else if (sort === "created") {
      orderBy = [{ createdAt: "desc" }];
    }

    const where: any = { userId: user.id };
    if (favoriteOnly) {
      where.isFavorite = true;
    }

    const packages = await db.package.findMany({
      where,
      orderBy,
      include: {
        children: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            parentId: true,
          },
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

    return NextResponse.json(packages);
  } catch (err: unknown) {
    console.error("GET packages error:", err);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = packageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    let parentId: string | null = null;
    if (result.data.parentId) {
      const parentPkg = await db.package.findFirst({
        where: { id: result.data.parentId, userId: user.id },
      });
      if (parentPkg) {
        parentId = parentPkg.id;
      }
    }

    // Get max sortOrder to append to end
    const lastPkg = await db.package.findFirst({
      where: { userId: user.id, parentId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = lastPkg ? lastPkg.sortOrder + 1 : 0;

    const newPackage = await db.package.create({
      data: {
        userId: user.id,
        parentId,
        name: result.data.name.trim(),
        description: result.data.description?.trim() || null,
        icon: result.data.icon || "Folder",
        color: result.data.color || "#3b82f6",
        isFavorite: result.data.isFavorite ?? false,
        sortOrder,
      },
      include: {
        _count: {
          select: {
            sections: true,
            urls: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (err: unknown) {
    console.error("POST package error:", err);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = reorderPackagesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid reorder payload" }, { status: 400 });
    }

    const { packageIds } = result.data;
    await db.$transaction(
      packageIds.map((id, index) =>
        db.package.updateMany({
          where: { id, userId: user.id },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("PUT reorder packages error:", err);
    return NextResponse.json({ error: "Failed to reorder packages" }, { status: 500 });
  }
}
