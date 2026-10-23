import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { urlSchema } from "@/lib/validations";
import { normalizeUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get("packageId");
    const sectionId = searchParams.get("sectionId");
    const tag = searchParams.get("tag");
    const favoriteOnly = searchParams.get("favorite") === "true";
    const query = searchParams.get("q")?.trim();

    // Safe pagination with hard limit capping to prevent RAM exhaustion / DoS
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 100);

    const rawPage = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : null;
    const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
    const offset = rawPage ? Math.max(0, (rawPage - 1) * limit) : Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);
    const currentPage = rawPage || Math.floor(offset / limit) + 1;

    const where: any = {
      userId: user.id,
    };

    if (packageId) {
      where.packageId = packageId;
    }

    if (sectionId !== null && sectionId !== undefined) {
      if (sectionId === "none") {
        where.sectionId = null;
      } else if (sectionId) {
        where.sectionId = sectionId;
      }
    }

    if (favoriteOnly) {
      where.isFavorite = true;
    }

    if (tag) {
      where.urlTags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { url: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, urls] = await Promise.all([
      db.url.count({ where }),
      db.url.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
        include: {
          package: {
            select: { id: true, name: true, color: true, icon: true },
          },
          section: {
            select: { id: true, name: true, icon: true },
          },
          urlTags: {
            include: { tag: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      urls,
      page: currentPage,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: offset + urls.length < total,
    });
  } catch (err: unknown) {
    console.error("GET urls error:", err);
    return NextResponse.json({ error: "Failed to fetch URLs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = urlSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const normalized = normalizeUrl(data.url);

    // Verify package ownership
    const pkg = await db.package.findFirst({
      where: { id: data.packageId, userId: user.id },
    });
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // If sectionId is provided, verify it belongs to this package
    if (data.sectionId) {
      const sec = await db.section.findFirst({
        where: { id: data.sectionId, packageId: pkg.id },
      });
      if (!sec) {
        return NextResponse.json({ error: "Section not found in package" }, { status: 404 });
      }
    }

    // Determine sortOrder
    const lastUrl = await db.url.findFirst({
      where: {
        userId: user.id,
        packageId: pkg.id,
        sectionId: data.sectionId || null,
      },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = lastUrl ? lastUrl.sortOrder + 1 : 0;

    // Handle tags (find or create)
    const tagConnectOrCreate = (data.tags || []).map((tagName) => {
      const cleanTag = tagName.trim().toLowerCase();
      return {
        tag: {
          connectOrCreate: {
            where: {
              userId_name: {
                userId: user.id,
                name: cleanTag,
              },
            },
            create: {
              userId: user.id,
              name: cleanTag,
            },
          },
        },
      };
    });

    const newUrl = await db.url.create({
      data: {
        userId: user.id,
        packageId: data.packageId,
        sectionId: data.sectionId || null,
        url: normalized,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        faviconUrl: data.faviconUrl?.trim() || null,
        isFavorite: data.isFavorite ?? false,
        sortOrder,
        urlTags: {
          create: tagConnectOrCreate,
        },
      },
      include: {
        package: {
          select: { id: true, name: true, color: true, icon: true },
        },
        section: {
          select: { id: true, name: true, icon: true },
        },
        urlTags: {
          include: { tag: true },
        },
      },
    });

    return NextResponse.json(newUrl, { status: 201 });
  } catch (err: unknown) {
    console.error("POST url error:", err);
    return NextResponse.json({ error: "Failed to create URL" }, { status: 500 });
  }
}
