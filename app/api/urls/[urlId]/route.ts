import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { urlSchema } from "@/lib/validations";
import { normalizeUrl } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: { urlId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await db.url.findFirst({
      where: { id: params.urlId, userId: user.id },
      include: {
        package: true,
        section: true,
        urlTags: { include: { tag: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (err: unknown) {
    console.error("GET url error:", err);
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { urlId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = urlSchema.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db.url.findFirst({
      where: { id: params.urlId, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    const data = result.data;

    // Verify package if changing packageId
    if (data.packageId && data.packageId !== existing.packageId) {
      const pkg = await db.package.findFirst({
        where: { id: data.packageId, userId: user.id },
      });
      if (!pkg) {
        return NextResponse.json({ error: "Target package not found" }, { status: 404 });
      }
    }

    // Verify section if changing sectionId
    if (data.sectionId) {
      const targetPkgId = data.packageId || existing.packageId;
      const sec = await db.section.findFirst({
        where: { id: data.sectionId, packageId: targetPkgId },
      });
      if (!sec) {
        return NextResponse.json({ error: "Target section not found in package" }, { status: 404 });
      }
    }

    // Update tags if provided
    if (data.tags !== undefined) {
      // Remove current urlTags
      await db.urlTag.deleteMany({
        where: { urlId: existing.id },
      });

      // Create new tag associations
      for (const tagName of data.tags) {
        const cleanTag = tagName.trim().toLowerCase();
        if (cleanTag) {
          const tag = await db.tag.upsert({
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
            update: {},
          });

          await db.urlTag.create({
            data: {
              urlId: existing.id,
              tagId: tag.id,
            },
          });
        }
      }
    }

    const updated = await db.url.update({
      where: { id: existing.id },
      data: {
        ...(data.url !== undefined && { url: normalizeUrl(data.url) }),
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.faviconUrl !== undefined && { faviconUrl: data.faviconUrl?.trim() || null }),
        ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
        ...(data.packageId !== undefined && { packageId: data.packageId }),
        ...(data.sectionId !== undefined && { sectionId: data.sectionId || null }),
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

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("PATCH url error:", err);
    return NextResponse.json({ error: "Failed to update URL" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { urlId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.url.findFirst({
      where: { id: params.urlId, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    await db.url.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ message: "URL deleted successfully" });
  } catch (err: unknown) {
    console.error("DELETE url error:", err);
    return NextResponse.json({ error: "Failed to delete URL" }, { status: 500 });
  }
}
