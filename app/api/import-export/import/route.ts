import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeUrl } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkQuota, quotaExceededResponse } from "@/lib/quotas/quota-service";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(`import:${user.id}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many import requests. Please wait ${rl.resetIn} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Support both direct packages payload and full LinkNest backup format
    let rawPackages: any[] = [];
    let rawNotes: any[] = [];
    let rawTasks: any[] = [];
    const skipDuplicates = body.skipDuplicates !== false;

    if (Array.isArray(body)) {
      rawPackages = body;
    } else if (Array.isArray(body.packages)) {
      rawPackages = body.packages;
      rawNotes = Array.isArray(body.notes) ? body.notes : [];
      rawTasks = Array.isArray(body.tasks) ? body.tasks : [];
    } else {
      return NextResponse.json({ error: "Invalid import payload structure." }, { status: 400 });
    }

    if (rawPackages.length > 500) {
      return NextResponse.json(
        { error: "Import batch too large. Maximum 500 packages allowed per import." },
        { status: 400 }
      );
    }

    // Check basic quotas
    const [pkgQuota, urlQuota] = await Promise.all([
      checkQuota(user.id, "packages", 1),
      checkQuota(user.id, "urls", 1),
    ]);

    if (!pkgQuota.allowed) {
      return quotaExceededResponse("packages", pkgQuota.limit, pkgQuota.used, 1);
    }
    if (!urlQuota.allowed) {
      return quotaExceededResponse("urls", urlQuota.limit, urlQuota.used, 1);
    }

    let importedPackages = 0;
    let importedSections = 0;
    let importedUrls = 0;
    let importedNotes = 0;
    let importedTasks = 0;
    let skippedDuplicates = 0;

    // Fetch existing user URLs to detect duplicates
    const existingUrls = await db.url.findMany({
      where: { userId: user.id },
      select: { url: true },
    });
    const existingUrlSet = new Set(existingUrls.map((u) => u.url));
    const urlMap = new Map<string, string>(); // maps original url/id to new urlId

    // Process packages
    for (const pkgData of rawPackages) {
      if (!pkgData.name) continue;

      let pkg = await db.package.findFirst({
        where: {
          userId: user.id,
          name: pkgData.name.trim(),
        },
      });

      if (!pkg) {
        pkg = await db.package.create({
          data: {
            userId: user.id,
            name: pkgData.name.trim(),
            description: pkgData.description || "Imported Package",
            icon: pkgData.icon || "Folder",
            color: pkgData.color || "#3b82f6",
          },
        });
        importedPackages++;
      }

      // Direct URLs
      const directUrls = Array.isArray(pkgData.directUrls)
        ? pkgData.directUrls
        : Array.isArray(pkgData.urls)
        ? pkgData.urls
        : [];

      for (const u of directUrls) {
        if (!u.url) continue;
        const norm = normalizeUrl(u.url);
        if (skipDuplicates && existingUrlSet.has(norm)) {
          skippedDuplicates++;
          continue;
        }

        const newUrl = await db.url.create({
          data: {
            userId: user.id,
            packageId: pkg.id,
            sectionId: null,
            title: u.title?.trim() || norm,
            url: norm,
            faviconUrl: u.faviconUrl || null,
            isFavorite: Boolean(u.isFavorite),
          },
        });
        existingUrlSet.add(norm);
        urlMap.set(norm, newUrl.id);
        if (u.id) urlMap.set(u.id, newUrl.id);
        importedUrls++;
      }

      // Sections
      if (Array.isArray(pkgData.sections)) {
        for (const secData of pkgData.sections) {
          if (!secData.name) continue;

          let sec = await db.section.findFirst({
            where: {
              packageId: pkg.id,
              name: secData.name.trim(),
            },
          });

          if (!sec) {
            sec = await db.section.create({
              data: {
                packageId: pkg.id,
                name: secData.name.trim(),
                icon: secData.icon || "FolderOpen",
              },
            });
            importedSections++;
          }

          if (Array.isArray(secData.urls)) {
            for (const u of secData.urls) {
              if (!u.url) continue;
              const norm = normalizeUrl(u.url);
              if (skipDuplicates && existingUrlSet.has(norm)) {
                skippedDuplicates++;
                continue;
              }

              const newUrl = await db.url.create({
                data: {
                  userId: user.id,
                  packageId: pkg.id,
                  sectionId: sec.id,
                  title: u.title?.trim() || norm,
                  url: norm,
                  faviconUrl: u.faviconUrl || null,
                  isFavorite: Boolean(u.isFavorite),
                },
              });
              existingUrlSet.add(norm);
              urlMap.set(norm, newUrl.id);
              if (u.id) urlMap.set(u.id, newUrl.id);
              importedUrls++;
            }
          }
        }
      }
    }

    // Process notes (if present in backup)
    for (const noteData of rawNotes) {
      if (!noteData.content && !noteData.title) continue;
      // Match URL by mapped ID or raw url
      const matchedUrlId =
        (noteData.urlId && urlMap.get(noteData.urlId)) ||
        (noteData.url?.url && urlMap.get(normalizeUrl(noteData.url.url)));

      if (matchedUrlId) {
        await db.note.create({
          data: {
            userId: user.id,
            urlId: matchedUrlId,
            title: noteData.title || "",
            content: noteData.content || "",
          },
        });
        importedNotes++;
      }
    }

    // Process tasks (if present in backup)
    for (const taskData of rawTasks) {
      if (!taskData.title) continue;
      await db.task.create({
        data: {
          userId: user.id,
          title: taskData.title.trim(),
          description: taskData.description || null,
          status: ["TODO", "IN_PROGRESS", "DONE"].includes(taskData.status)
            ? taskData.status
            : "TODO",
          priority: ["LOW", "MEDIUM", "HIGH"].includes(taskData.priority)
            ? taskData.priority
            : "MEDIUM",
          dueAt: taskData.dueAt ? new Date(taskData.dueAt) : null,
          reminderAt: taskData.reminderAt ? new Date(taskData.reminderAt) : null,
        },
      });
      importedTasks++;
    }

    return NextResponse.json({
      success: true,
      report: {
        importedPackages,
        importedSections,
        importedUrls,
        importedNotes,
        importedTasks,
        skippedDuplicates,
      },
    });
  } catch (err: unknown) {
    console.error("Import execution error:", err);
    return NextResponse.json({ error: "Failed to complete import" }, { status: 500 });
  }
}
