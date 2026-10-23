import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { QUOTA_DEFAULTS } from "@/lib/quotas/limits";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const uid = user.id;

    // Fetch all counts in parallel
    const [
      packagesCount,
      sectionsCount,
      urlsCount,
      notesCount,
      tagsCount,
      tasksCount,
      attachmentsCount,
      attachmentBytesAgg,
    ] = await Promise.all([
      db.package.count({ where: { userId: uid } }),
      db.section.count({ where: { package: { userId: uid } } }),
      db.url.count({ where: { userId: uid } }),
      db.note.count({ where: { userId: uid } }),
      db.tag.count({ where: { userId: uid } }),
      db.task.count({ where: { userId: uid } }),
      db.attachment.count({ where: { userId: uid } }),
      db.attachment.aggregate({ where: { userId: uid }, _sum: { sizeBytes: true } }),
    ]);

    const attachmentBytes = attachmentBytesAgg._sum.sizeBytes ?? 0;

    const usage = {
      packages:         { used: packagesCount,    limit: QUOTA_DEFAULTS.packages,             pct: pct(packagesCount,    QUOTA_DEFAULTS.packages) },
      sections:         { used: sectionsCount,    limit: QUOTA_DEFAULTS.sections,             pct: pct(sectionsCount,    QUOTA_DEFAULTS.sections) },
      urls:             { used: urlsCount,        limit: QUOTA_DEFAULTS.urls,                 pct: pct(urlsCount,        QUOTA_DEFAULTS.urls) },
      notes:            { used: notesCount,       limit: QUOTA_DEFAULTS.notes,                pct: pct(notesCount,       QUOTA_DEFAULTS.notes) },
      tags:             { used: tagsCount,        limit: QUOTA_DEFAULTS.tags,                 pct: pct(tagsCount,        QUOTA_DEFAULTS.tags) },
      tasks:            { used: tasksCount,       limit: QUOTA_DEFAULTS.tasks,                pct: pct(tasksCount,       QUOTA_DEFAULTS.tasks) },
      attachments:      { used: attachmentsCount, limit: QUOTA_DEFAULTS.totalAttachments,     pct: pct(attachmentsCount, QUOTA_DEFAULTS.totalAttachments) },
      attachmentBytes:  { used: attachmentBytes,  limit: QUOTA_DEFAULTS.totalAttachmentBytes, pct: pct(attachmentBytes,  QUOTA_DEFAULTS.totalAttachmentBytes) },
    };

    return NextResponse.json({ usage, limits: QUOTA_DEFAULTS });
  } catch (err) {
    console.error("GET /api/user/quota error:", err);
    return NextResponse.json({ error: "Failed to fetch quota" }, { status: 500 });
  }
}

function pct(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}
