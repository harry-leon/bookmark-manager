import { describe, it, expect } from "vitest";
import { validateAttachmentBuffer } from "@/lib/storage/attachment-validator";
import { QUOTA_DEFAULTS } from "@/lib/quotas/limits";

describe("Attachment Validator", () => {
  it("approves valid JPEG magic bytes", () => {
    // JPEG header: FF D8 FF
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const result = validateAttachmentBuffer(jpegBuffer, "image/jpeg", jpegBuffer.length);
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("image/jpeg");
  });

  it("approves valid PNG magic bytes", () => {
    // PNG header: 89 50 4E 47 0D 0A 1A 0A
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = validateAttachmentBuffer(pngBuffer, "image/png", pngBuffer.length);
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("image/png");
  });

  it("rejects disallowed SVG format for XSS safety", () => {
    const svgBuffer = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
    const result = validateAttachmentBuffer(svgBuffer, "image/svg+xml", svgBuffer.length);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not allowed");
  });

  it("rejects mismatched declared vs actual format", () => {
    // Actual JPEG, but declared as PNG
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const result = validateAttachmentBuffer(jpegBuffer, "image/png", jpegBuffer.length);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("does not match");
  });

  it("rejects files exceeding the 5MB size limit", () => {
    const fakeJpeg = Buffer.from([0xff, 0xd8, 0xff]);
    const oversized = 6 * 1024 * 1024; // 6 MB
    const result = validateAttachmentBuffer(fakeJpeg, "image/jpeg", oversized);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });
});

describe("Quota Configuration", () => {
  it("enforces default quota limits", () => {
    expect(QUOTA_DEFAULTS.packages).toBeGreaterThanOrEqual(100);
    expect(QUOTA_DEFAULTS.sections).toBeGreaterThanOrEqual(500);
    expect(QUOTA_DEFAULTS.urls).toBeGreaterThanOrEqual(10000);
    expect(QUOTA_DEFAULTS.notes).toBeGreaterThanOrEqual(2000);
    expect(QUOTA_DEFAULTS.tasks).toBeGreaterThanOrEqual(5000);
    expect(QUOTA_DEFAULTS.imagesPerNote).toBe(10);
    expect(QUOTA_DEFAULTS.maxImageBytes).toBe(5 * 1024 * 1024);
  });
});
