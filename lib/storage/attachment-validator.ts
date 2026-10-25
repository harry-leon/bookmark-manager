import { QUOTA_DEFAULTS } from "@/lib/quotas/limits";

// ── Allowed MIME types ─────────────────────────────────────────────────────

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

// Magic byte signatures for supported image types
const IMAGE_SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF....WEBP
  { mime: "image/gif",  bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
];

// ── Validation result ──────────────────────────────────────────────────────

export interface AttachmentValidationResult {
  valid: boolean;
  detectedMime?: string;
  error?: string;
}

/**
 * Validates an uploaded file buffer:
 * 1. Checks declared MIME type is in the allowlist
 * 2. Verifies magic bytes match an allowed format
 * 3. Checks file size against the configured limit
 *
 * Image dimension checking is done separately in the API route via sharp.
 */
export function validateAttachmentBuffer(
  buffer: Buffer,
  declaredMime: string,
  sizeBytes: number
): AttachmentValidationResult {
  // 1. Allowlist check on declared MIME
  const normalised = declaredMime.toLowerCase().split(";")[0].trim();
  if (!ALLOWED_IMAGE_MIME_TYPES.has(normalised)) {
    return {
      valid: false,
      error: `File type "${normalised}" is not allowed. Accepted types: JPEG, PNG, WebP, GIF.`,
    };
  }

  // 2. Magic bytes verification
  const matchedMime = detectMimeFromBuffer(buffer);
  if (!matchedMime) {
    return {
      valid: false,
      error: "File content does not match a supported image format.",
    };
  }

  // 3. Cross-check declared vs detected
  if (matchedMime !== normalised) {
    return {
      valid: false,
      detectedMime: matchedMime,
      error: `Declared type "${normalised}" does not match detected type "${matchedMime}".`,
    };
  }

  // 4. Size limit
  const maxBytes = QUOTA_DEFAULTS.maxImageBytes;
  if (sizeBytes > maxBytes) {
    const maxMB = (maxBytes / 1024 / 1024).toFixed(0);
    return {
      valid: false,
      error: `File is too large (${(sizeBytes / 1024 / 1024).toFixed(1)} MB). Maximum allowed is ${maxMB} MB.`,
    };
  }

  return { valid: true, detectedMime: matchedMime };
}

function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const sig of IMAGE_SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;

    const match = sig.bytes.every((b, i) => buffer[offset + i] === b);

    if (match) {
      // Special case: WebP requires checking bytes 8-11 for "WEBP"
      if (sig.mime === "image/webp") {
        if (
          buffer.length >= 12 &&
          buffer[8] === 0x57 && // W
          buffer[9] === 0x45 && // E
          buffer[10] === 0x42 && // B
          buffer[11] === 0x50   // P
        ) {
          return "image/webp";
        }
        continue;
      }
      return sig.mime;
    }
  }
  return null;
}
