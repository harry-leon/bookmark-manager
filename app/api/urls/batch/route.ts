import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { batchUrlActionSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = batchUrlActionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { action, urlIds, targetPackageId, targetSectionId, tagName } = result.data;

    // Filter to only URLs owned by user
    const validUrls = await db.url.findMany({
      where: {
        id: { in: urlIds },
        userId: user.id,
      },
      select: { id: true },
    });

    const validIds = validUrls.map((u) => u.id);
    if (validIds.length === 0) {
      return NextResponse.json({ error: "No matching URLs found to process" }, { status: 404 });
    }

    switch (action) {
      case "delete": {
        const deleted = await db.url.deleteMany({
          where: {
            id: { in: validIds },
            userId: user.id,
          },
        });
        return NextResponse.json({
          message: `Successfully deleted ${deleted.count} URLs`,
          count: deleted.count,
        });
      }

      case "favorite": {
        const updated = await db.url.updateMany({
          where: {
            id: { in: validIds },
            userId: user.id,
          },
          data: { isFavorite: true },
        });
        return NextResponse.json({
          message: `Marked ${updated.count} URLs as favorite`,
          count: updated.count,
        });
      }

      case "unfavorite": {
        const updated = await db.url.updateMany({
          where: {
            id: { in: validIds },
            userId: user.id,
          },
          data: { isFavorite: false },
        });
        return NextResponse.json({
          message: `Removed ${updated.count} URLs from favorites`,
          count: updated.count,
        });
      }

      case "move": {
        if (!targetPackageId) {
          return NextResponse.json({ error: "targetPackageId is required for move" }, { status: 400 });
        }

        // Verify package ownership
        const targetPkg = await db.package.findFirst({
          where: { id: targetPackageId, userId: user.id },
        });
        if (!targetPkg) {
          return NextResponse.json({ error: "Target package not found" }, { status: 404 });
        }

        // If targetSectionId provided, verify it belongs to targetPkg
        if (targetSectionId) {
          const targetSec = await db.section.findFirst({
            where: { id: targetSectionId, packageId: targetPkg.id },
          });
          if (!targetSec) {
            return NextResponse.json({ error: "Target section not found" }, { status: 404 });
          }
        }

        const updated = await db.url.updateMany({
          where: {
            id: { in: validIds },
            userId: user.id,
          },
          data: {
            packageId: targetPkg.id,
            sectionId: targetSectionId || null,
          },
        });

        return NextResponse.json({
          message: `Moved ${updated.count} URLs to ${targetPkg.name}`,
          count: updated.count,
        });
      }

      case "addTag": {
        if (!tagName) {
          return NextResponse.json({ error: "tagName is required for addTag" }, { status: 400 });
        }
        const cleanTag = tagName.trim().toLowerCase();
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

        // Insert urlTags ignoring duplicates
        let addedCount = 0;
        for (const urlId of validIds) {
          try {
            await db.urlTag.upsert({
              where: {
                urlId_tagId: {
                  urlId,
                  tagId: tag.id,
                },
              },
              create: {
                urlId,
                tagId: tag.id,
              },
              update: {},
            });
            addedCount++;
          } catch {
            // ignore
          }
        }

        return NextResponse.json({
          message: `Tagged ${addedCount} URLs with #${cleanTag}`,
          count: addedCount,
        });
      }

      default:
        return NextResponse.json({ error: "Unsupported batch action" }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error("POST batch URLs error:", err);
    return NextResponse.json({ error: "Failed to perform batch action" }, { status: 500 });
  }
}
