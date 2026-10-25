import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateTaskSchema = z.object({
  title:       z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  status:      z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority:    z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueAt:       z.string().datetime().optional().nullable(),
  reminderAt:  z.string().datetime().optional().nullable(),
  packageId:   z.string().optional().nullable(),
  sectionId:   z.string().optional().nullable(),
  urlId:       z.string().optional().nullable(),
  noteId:      z.string().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const task = await db.task.findFirst({
      where: { id: params.taskId, userId: user.id },
      include: {
        url:     { select: { id: true, title: true, url: true } },
        package: { select: { id: true, name: true, color: true } },
        section: { select: { id: true, name: true } },
        note:    { select: { id: true, title: true } },
      },
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch (err) {
    console.error("GET /api/tasks/[taskId]:", err);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.task.findFirst({ where: { id: params.taskId, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;

    // If task is being marked DONE, clear reminderAt so no future reminders are sent
    const reminderAt = d.status === "DONE"
      ? null
      : (d.reminderAt !== undefined ? (d.reminderAt ? new Date(d.reminderAt) : null) : undefined);

    // If reminderAt is changing, reset reminderSentAt
    const reminderSentAt = (d.reminderAt !== undefined || d.status === "DONE")
      ? null
      : undefined;

    const task = await db.task.update({
      where: { id: params.taskId },
      data: {
        ...(d.title       !== undefined && { title: d.title }),
        ...(d.description !== undefined && { description: d.description }),
        ...(d.status      !== undefined && { status: d.status }),
        ...(d.priority    !== undefined && { priority: d.priority }),
        ...(d.dueAt       !== undefined && { dueAt: d.dueAt ? new Date(d.dueAt) : null }),
        ...(reminderAt    !== undefined && { reminderAt }),
        ...(reminderSentAt !== undefined && { reminderSentAt }),
        ...(d.packageId   !== undefined && { packageId: d.packageId }),
        ...(d.sectionId   !== undefined && { sectionId: d.sectionId }),
        ...(d.urlId       !== undefined && { urlId: d.urlId }),
        ...(d.noteId      !== undefined && { noteId: d.noteId }),
      },
      include: {
        url:     { select: { id: true, title: true, url: true } },
        package: { select: { id: true, name: true, color: true } },
        section: { select: { id: true, name: true } },
        note:    { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(task);
  } catch (err) {
    console.error("PATCH /api/tasks/[taskId]:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.task.findFirst({ where: { id: params.taskId, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    await db.task.delete({ where: { id: params.taskId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tasks/[taskId]:", err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
