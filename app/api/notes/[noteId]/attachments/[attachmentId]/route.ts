import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteAttachment, isStorageConfigured } from "@/lib/storage/storage-service";

export const dynamic = "force-dynamic";

// ── DELETE /api/notes/[noteId]/attachments/[attachmentId] ──────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: { noteId: string; attachmentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify note ownership, then attachment ownership
    const note = await db.note.findFirst({ where: { id: params.noteId, userId: user.id } });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    const attachment = await db.attachment.findFirst({
      where: { id: params.attachmentId, noteId: params.noteId, userId: user.id },
    });
    if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

    // Delete from object storage (best-effort, don't block on failure)
    if (isStorageConfigured()) {
      try {
        await deleteAttachment(attachment.storageKey);
      } catch (storageErr) {
        console.error("Failed to delete object from storage:", storageErr);
        // Continue — still remove DB record to avoid orphaned metadata
      }
    }

    await db.attachment.delete({ where: { id: params.attachmentId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE attachment error:", err);
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }
}

// ── GET /api/notes/[noteId]/attachments/[attachmentId] — signed URL ────────
export async function GET(
  _req: Request,
  { params }: { params: { noteId: string; attachmentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const note = await db.note.findFirst({ where: { id: params.noteId, userId: user.id } });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    const attachment = await db.attachment.findFirst({
      where: { id: params.attachmentId, noteId: params.noteId, userId: user.id },
    });
    if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

    if (!isStorageConfigured()) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
    }

    const { getSignedUrl } = await import("@/lib/storage/storage-service");
    const signedUrl = await getSignedUrl(attachment.storageKey, 900);

    return NextResponse.json({ signedUrl, expiresIn: 900 });
  } catch (err) {
    console.error("GET attachment signed-url error:", err);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}
