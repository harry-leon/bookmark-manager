import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkQuota, checkNoteImageQuota, quotaExceededResponse } from "@/lib/quotas/quota-service";
import { QUOTA_DEFAULTS } from "@/lib/quotas/limits";
import { validateAttachmentBuffer, ALLOWED_IMAGE_EXTENSIONS } from "@/lib/storage/attachment-validator";
import {
  uploadAttachment,
  generateStorageKey,
  getSignedUrl,
  isStorageConfigured,
} from "@/lib/storage/storage-service";

export const dynamic = "force-dynamic";

export async function POST(

  req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit: 20 uploads per minute per user
    const rl = checkRateLimit(`attach:upload:${user.id}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Too many uploads. Retry in ${rl.resetIn}s.` }, { status: 429 });
    }

    // Storage must be configured
    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: "File storage is not configured on this server." },
        { status: 503 }
      );
    }

    // Verify note ownership
    const note = await db.note.findFirst({ where: { id: params.noteId, userId: user.id } });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const declaredMime = file.type || "application/octet-stream";
    const sizeBytes = buffer.length;

    // ── Validation ────────────────────────────────────────────────────────

    // 1. MIME type + magic bytes + size
    const validation = validateAttachmentBuffer(buffer, declaredMime, sizeBytes);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const detectedMime = validation.detectedMime!;

    // 2. Image dimensions via sharp
    let width: number | undefined;
    let height: number | undefined;
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(buffer).metadata();
      width  = meta.width;
      height = meta.height;

      const maxW = QUOTA_DEFAULTS.maxImageWidth;
      const maxH = QUOTA_DEFAULTS.maxImageHeight;
      if (width && height && (width > maxW || height > maxH)) {
        return NextResponse.json(
          { error: `Image dimensions ${width}×${height} exceed the maximum allowed ${maxW}×${maxH}.` },
          { status: 400 }
        );
      }
    } catch (sharpErr) {
      console.warn("sharp metadata failed:", sharpErr);
      // Non-fatal: proceed without dimension validation
    }

    // 3. Per-note image count quota
    const noteImgQuota = await checkNoteImageQuota(params.noteId);
    if (!noteImgQuota.allowed) {
      return quotaExceededResponse("images_per_note", noteImgQuota.limit, noteImgQuota.used, 1);
    }

    // 4. Total attachment count quota
    const totalCountQuota = await checkQuota(user.id, "totalAttachments");
    if (!totalCountQuota.allowed) {
      return quotaExceededResponse("total_attachments", totalCountQuota.limit, totalCountQuota.used, 1);
    }

    // 5. Total storage bytes quota
    const totalBytesQuota = await checkQuota(user.id, "totalAttachmentBytes", sizeBytes);
    if (!totalBytesQuota.allowed) {
      return quotaExceededResponse("attachment_storage", totalBytesQuota.limit, totalBytesQuota.used, sizeBytes);
    }

    // ── Upload ────────────────────────────────────────────────────────────
    const ext = ALLOWED_IMAGE_EXTENSIONS[detectedMime] ?? "bin";
    const storageKey = generateStorageKey(user.id, params.noteId, ext);

    await uploadAttachment(buffer, storageKey, detectedMime);

    // ── Persist metadata ──────────────────────────────────────────────────
    const attachment = await db.attachment.create({
      data: {
        userId: user.id,
        noteId: params.noteId,
        storageKey,
        originalFilename: file.name || `image.${ext}`,
        mimeType: detectedMime,
        sizeBytes,
        width:  width  ?? null,
        height: height ?? null,
      },
    });

    // Generate an initial signed URL for immediate display
    const signedUrl = await getSignedUrl(storageKey, 900);

    return NextResponse.json(
      {
        id:       attachment.id,
        signedUrl,
        mimeType: detectedMime,
        sizeBytes,
        width:    width  ?? null,
        height:   height ?? null,
        originalFilename: attachment.originalFilename,
        createdAt: attachment.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/notes/[noteId]/attachments error:", err);
    return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const note = await db.note.findFirst({ where: { id: params.noteId, userId: user.id } });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    const attachments = await db.attachment.findMany({
      where: { noteId: params.noteId },
      orderBy: { createdAt: "asc" },
    });

    // Generate signed URLs for all attachments
    const withUrls = await Promise.all(
      attachments.map(async (a) => ({
        id: a.id,
        originalFilename: a.originalFilename,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        width: a.width,
        height: a.height,
        createdAt: a.createdAt,
        signedUrl: isStorageConfigured() ? await getSignedUrl(a.storageKey, 900) : null,
      }))
    );

    return NextResponse.json({ attachments: withUrls });
  } catch (err) {
    console.error("GET /api/notes/[noteId]/attachments error:", err);
    return NextResponse.json({ error: "Failed to fetch attachments" }, { status: 500 });
  }
}
