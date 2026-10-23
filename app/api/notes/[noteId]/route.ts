import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateNoteSchema = z.object({
  title:   z.string().max(255).optional(),
  content: z.string().max(50_000, "Note content exceeds 50,000 characters").optional(),
});

// ── GET /api/notes/[noteId] ────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const note = await db.note.findFirst({
      where: { id: params.noteId, userId: user.id },
      include: {
        url: { select: { id: true, url: true, title: true, packageId: true, sectionId: true } },
        attachments: {
          orderBy: { createdAt: "asc" },
          select: { id: true, originalFilename: true, mimeType: true, sizeBytes: true, width: true, height: true, createdAt: true },
        },
        _count: { select: { attachments: true } },
      },
    });

    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json(note);
  } catch (err) {
    console.error("GET /api/notes/[noteId] error:", err);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

// ── PATCH /api/notes/[noteId] ─────────────────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.note.findFirst({ where: { id: params.noteId, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    const updated = await db.note.update({
      where: { id: params.noteId },
      data: {
        ...(parsed.data.title   !== undefined && { title:   parsed.data.title }),
        ...(parsed.data.content !== undefined && { content: parsed.data.content }),
      },
      include: {
        url: { select: { id: true, url: true, title: true } },
        _count: { select: { attachments: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/notes/[noteId] error:", err);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// ── DELETE /api/notes/[noteId] ────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.note.findFirst({
      where: { id: params.noteId, userId: user.id },
      include: { attachments: { select: { storageKey: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    // Delete storage objects for all attachments (best-effort)
    if (existing.attachments.length > 0) {
      const { isStorageConfigured, deleteAttachment } = await import("@/lib/storage/storage-service");
      if (isStorageConfigured()) {
        await Promise.allSettled(
          existing.attachments.map((a) => deleteAttachment(a.storageKey))
        );
      }
    }

    await db.note.delete({ where: { id: params.noteId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/notes/[noteId] error:", err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
