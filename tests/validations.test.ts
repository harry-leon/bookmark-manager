import { describe, it, expect } from "vitest";
import { urlSchema, packageSchema, sectionSchema, batchUrlActionSchema } from "@/lib/validations";
import { normalizeUrl, isValidUrl, getDomain } from "@/lib/utils";

describe("URL Utilities & Normalization", () => {
  it("should validate valid http and https URLs", () => {
    expect(isValidUrl("https://nextjs.org")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("ftp://test.com")).toBe(false);
  });

  it("should normalize URLs with missing protocol and trim spaces", () => {
    expect(normalizeUrl("   nextjs.org   ")).toBe("https://nextjs.org/");
    expect(normalizeUrl("http://example.com/api ")).toBe("http://example.com/api");
  });

  it("should extract clean domain name without www", () => {
    expect(getDomain("https://www.google.com/search?q=test")).toBe("google.com");
    expect(getDomain("https://github.com/facebook/react")).toBe("github.com");
  });
});

describe("Zod Validation Schemas", () => {
  it("should accept valid URL schema payload", () => {
    const payload = {
      packageId: "pkg_123",
      sectionId: "sec_456",
      url: "https://tailwindcss.com",
      title: "Tailwind CSS",
      description: "Utility-first framework",
      isFavorite: true,
      tags: ["frontend", "css"],
    };

    const res = urlSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it("should reject invalid URL in schema", () => {
    const payload = {
      packageId: "pkg_123",
      url: "invalid-url",
      title: "Invalid",
    };

    const res = urlSchema.safeParse(payload);
    expect(res.success).toBe(false);
  });

  it("should validate batch URL action schema", () => {
    const validBatch = {
      action: "move",
      urlIds: ["url_1", "url_2"],
      targetPackageId: "pkg_999",
      targetSectionId: null,
    };
    expect(batchUrlActionSchema.safeParse(validBatch).success).toBe(true);

    const emptyBatch = {
      action: "delete",
      urlIds: [],
    };
    expect(batchUrlActionSchema.safeParse(emptyBatch).success).toBe(false);
  });
});
