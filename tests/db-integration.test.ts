import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

describe("Database Integration & Tenant Isolation (PostgreSQL)", () => {
  let userAId: string;
  let userBId: string;
  let packageAId: string;
  let sectionA1Id: string;
  let sectionA2Id: string;
  let urlA1Id: string;

  beforeAll(async () => {
    // Create test user A and user B
    const hash = await bcrypt.hash("Password123!", 10);
    const userA = await db.user.create({
      data: {
        email: `test_user_a_${Date.now()}@example.com`,
        name: "Test User A",
        password: hash,
      },
    });
    userAId = userA.id;

    const userB = await db.user.create({
      data: {
        email: `test_user_b_${Date.now()}@example.com`,
        name: "Test User B",
        password: hash,
      },
    });
    userBId = userB.id;
  });

  afterAll(async () => {
    // Clean up test users and cascade
    await db.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
    await db.$disconnect();
  });

  it("should create Package and Section for User A", async () => {
    const pkg = await db.package.create({
      data: {
        userId: userAId,
        name: "Integration Test Package",
        description: "Testing CRUD operations",
        color: "#3b82f6",
        icon: "Folder",
      },
    });
    packageAId = pkg.id;
    expect(pkg.id).toBeDefined();

    const sec1 = await db.section.create({
      data: {
        packageId: pkg.id,
        name: "Section 1",
        sortOrder: 0,
      },
    });
    sectionA1Id = sec1.id;

    const sec2 = await db.section.create({
      data: {
        packageId: pkg.id,
        name: "Section 2",
        sortOrder: 1,
      },
    });
    sectionA2Id = sec2.id;

    expect(sec1.id).toBeDefined();
    expect(sec2.id).toBeDefined();
  });

  it("should create URL under Section 1 and move to Section 2", async () => {
    const urlItem = await db.url.create({
      data: {
        userId: userAId,
        packageId: packageAId,
        sectionId: sectionA1Id,
        title: "Vitest Testing Framework",
        url: "https://vitest.dev",
        description: "Fast unit testing",
        isFavorite: true,
      },
    });
    urlA1Id = urlItem.id;
    expect(urlItem.sectionId).toBe(sectionA1Id);

    // Move to Section 2
    const moved = await db.url.update({
      where: { id: urlItem.id },
      data: { sectionId: sectionA2Id },
    });
    expect(moved.sectionId).toBe(sectionA2Id);
  });

  it("should support direct Package URLs without section (sectionId: null)", async () => {
    const directUrl = await db.url.create({
      data: {
        userId: userAId,
        packageId: packageAId,
        sectionId: null,
        title: "Direct Package Link",
        url: "https://github.com/vitest-dev/vitest",
      },
    });
    expect(directUrl.sectionId).toBeNull();
  });

  it("should enforce tenant data isolation (User B cannot access User A's data)", async () => {
    // Query User B's packages
    const userBPackages = await db.package.findMany({
      where: { userId: userBId },
    });
    // Should not include User A's package
    expect(userBPackages.some((p) => p.id === packageAId)).toBe(false);

    // User B trying to delete User A's package through where filter
    const deleteAttempt = await db.package.deleteMany({
      where: { id: packageAId, userId: userBId },
    });
    expect(deleteAttempt.count).toBe(0);

    // Package A still exists
    const checkPkg = await db.package.findUnique({ where: { id: packageAId } });
    expect(checkPkg).not.toBeNull();
  });

  it("should preserve URLs at Package level when Section is deleted with preserve option", async () => {
    // Delete section 2 but first nullify sectionId of URLs
    await db.url.updateMany({
      where: { sectionId: sectionA2Id },
      data: { sectionId: null },
    });

    await db.section.delete({
      where: { id: sectionA2Id },
    });

    // Check URL still exists in the package with sectionId null
    const urlCheck = await db.url.findUnique({ where: { id: urlA1Id } });
    expect(urlCheck).not.toBeNull();
    expect(urlCheck?.sectionId).toBeNull();
    expect(urlCheck?.packageId).toBe(packageAId);
  });
});
