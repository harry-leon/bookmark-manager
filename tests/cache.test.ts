import { describe, it, expect } from "vitest";
import { metadataCache } from "@/lib/cache";

describe("Metadata In-Memory TTL Cache", () => {
  it("should set and retrieve values within TTL", () => {
    metadataCache.set("https://example.com/test", {
      title: "Example Title",
      description: "Example Description",
      faviconUrl: "https://example.com/favicon.ico",
    });

    const hit = metadataCache.get("https://example.com/test");
    expect(hit).toBeDefined();
    expect(hit?.title).toBe("Example Title");
  });

  it("should return null on cache misses", () => {
    const miss = metadataCache.get("https://nonexistent-url-key.org");
    expect(miss).toBeNull();
  });

  it("should expire items after TTL", async () => {
    metadataCache.set("https://quick-expire.com", { title: "Quick" }, 20); // 20ms TTL
    expect(metadataCache.get("https://quick-expire.com")?.title).toBe("Quick");

    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(metadataCache.get("https://quick-expire.com")).toBeNull();
  });
});
