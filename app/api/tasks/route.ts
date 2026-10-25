import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { checkQuota, quotaExceededResponse } from "@/lib/quotas/quota-service";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const createTaskSchema = z.object({
  title:       z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional().nullable(),
  status:      z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority:    z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueAt:       z.string().datetime().optional().nullable(),
  reminderAt:  z.string().datetime().optional().nullable(),
  // At most one resource association
  packageId:   z.string().optional().nullable(),
  sectionId:   z.string().optional().nullable(),
  urlId:       z.string().optional().nullable(),
  noteId:      z.string().optional().nullable(),
}).refine(
  (data) => {
    const count = [data.packageId, data.sectionId, data.urlId, data.noteId]
      .filter(Boolean).length;
    return count <= 1;
  },
  { message: "A task can only be linked to one resource at a time." }
);

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status   = searchParams.get("status");
    const priority = searchParams.get("priority");
    const filter   = searchParams.get("filter"); // "upcoming" | "overdue" | "today"
    const limit    = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
    const offset   = parseInt(searchParams.get("offset") ?? "0", 10);

    const now = new Date();
    const where: any = { userId: user.id };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (filter === "overdue") {
      where.dueAt = { lt: now };
      where.status = { not: "DONE" };
    } else if (filter === "upcoming") {
      where.dueAt = { gte: now };
      where.status = { not: "DONE" };
    } else if (filter === "today") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      where.dueAt = { gte: startOfDay, lte: endOfDay };
    }

    const [total, tasks] = await Promise.all([
      db.task.count({ where }),
      db.task.findMany({
        where,
        orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
        include: {
          url:     { select: { id: true, title: true, url: true } },
          package: { select: { id: true, name: true, color: true } },
          section: { select: { id: true, name: true } },
          note:    { select: { id: true, title: true } },
        },
      }),
    ]);

    return NextResponse.json({ total, tasks, hasMore: offset + tasks.length < total });
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = checkRateLimit(`tasks:create:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Rate limit exceeded. Retry in ${rl.resetIn}s.` }, { status: 429 });
    }

    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Quota check
    const quota = await checkQuota(user.id, "tasks");
    if (!quota.allowed) return quotaExceededResponse("tasks", quota.limit, quota.used, 1);

    // Verify associated resource ownership (if provided)
    if (data.packageId) {
      const pkg = await db.package.findFirst({ where: { id: data.packageId, userId: user.id } });
      if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    if (data.sectionId) {
      const sec = await db.section.findFirst({ where: { id: data.sectionId, package: { userId: user.id } } });
      if (!sec) return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }
    if (data.urlId) {
      const url = await db.url.findFirst({ where: { id: data.urlId, userId: user.id } });
      if (!url) return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }
    if (data.noteId) {
      const note = await db.note.findFirst({ where: { id: data.noteId, userId: user.id } });
      if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const task = await db.task.create({
      data: {
        userId:      user.id,
        title:       data.title,
        description: data.description ?? null,
        status:      data.status,
        priority:    data.priority,
        dueAt:       data.dueAt ? new Date(data.dueAt) : null,
        reminderAt:  data.reminderAt ? new Date(data.reminderAt) : null,
        packageId:   data.packageId ?? null,
        sectionId:   data.sectionId ?? null,
        urlId:       data.urlId ?? null,
        noteId:      data.noteId ?? null,
      },
      include: {
        url:     { select: { id: true, title: true, url: true } },
        package: { select: { id: true, name: true, color: true } },
        section: { select: { id: true, name: true } },
        note:    { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
