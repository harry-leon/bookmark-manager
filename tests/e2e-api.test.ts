import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const BASE_URL = "http://localhost:3000";

describe("End-to-End Live Application Verification (localhost:3000)", { timeout: 25000 }, () => {
  let sessionCookie = "";
  let createdPackageId = "";
  let createdSectionId = "";
  let createdUrlId = "";

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const user = await db.user.upsert({
      where: { email: "demo@linkstack.app" },
      update: { password: passwordHash },
      create: {
        email: "demo@linkstack.app",
        name: "Demo User",
        password: passwordHash,
      },
    });

    const existingPkg = await db.package.findFirst({ where: { userId: user.id } });
    if (!existingPkg) {
      const pkg = await db.package.create({
        data: {
          userId: user.id,
          name: "Default Package",
          icon: "Folder",
          color: "#3b82f6",
        },
      });
      await db.url.create({
        data: {
          userId: user.id,
          packageId: pkg.id,
          title: "Demo Link",
          url: "https://linkstack.app",
        },
      });
    }
  });

  it("1. should serve public Landing page on / and redirect unauthenticated /packages to /login", async () => {
    // 1. Unauthenticated request to / returns 200 OK (Landing / Introduction page)
    const landingRes = await fetch(`${BASE_URL}/`);
    expect(landingRes.status).toBe(200);
    const html = await landingRes.text();
    expect(html).toContain("LinkStack");
    expect(html).toContain("harry-leon");

    // 2. Protected route /packages must redirect (307) to /login
    const protectedRes = await fetch(`${BASE_URL}/packages`, {
      redirect: "manual",
    });
    expect(protectedRes.status).toBe(307);
    const location = protectedRes.headers.get("location");
    expect(location).toContain("/login");
  });

  it("2. should return 200 OK on /login page", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("LinkStack");
  });

  it("3. should authenticate successfully with demo account", async () => {
    // Get CSRF token
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    expect(csrfRes.status).toBe(200);
    const { csrfToken } = await csrfRes.json();
    const csrfCookies = (csrfRes.headers as any).getSetCookie
      ? (csrfRes.headers as any).getSetCookie()
      : [csrfRes.headers.get("set-cookie") || ""];

    const cookieHeader = csrfCookies.map((c: string) => c.split(";")[0]).join("; ");

    // Sign in
    const signInRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: new URLSearchParams({
        csrfToken,
        email: "demo@linkstack.app",
        password: "Password123!",
        json: "true",
      }),
      redirect: "manual",
    });

    const authCookies = (signInRes.headers as any).getSetCookie
      ? (signInRes.headers as any).getSetCookie()
      : [signInRes.headers.get("set-cookie") || ""];

    sessionCookie = [...csrfCookies, ...authCookies].map((c: string) => c.split(";")[0]).join("; ");
    expect(signInRes.status).toBeLessThan(400);
  });

  it("4. should fetch dashboard metrics for authenticated user", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalPackages).toBeGreaterThanOrEqual(1);
    expect(data.totalUrls).toBeGreaterThanOrEqual(1);
  });

  it("5. should perform Package CRUD", async () => {
    // Create package
    const createRes = await fetch(`${BASE_URL}/api/packages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        name: "E2E Live Test Package",
        description: "Created during live test",
        color: "#6366f1",
        icon: "Box",
        isFavorite: true,
      }),
    });
    expect(createRes.status).toBe(201);
    const pkg = await createRes.json();
    createdPackageId = pkg.id;
    expect(pkg.name).toBe("E2E Live Test Package");

    // Get package detail
    const getRes = await fetch(`${BASE_URL}/api/packages/${createdPackageId}`, {
      headers: { Cookie: sessionCookie },
    });
    expect(getRes.status).toBe(200);
  });

  it("6. should create Section under package", async () => {
    const res = await fetch(`${BASE_URL}/api/sections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        packageId: createdPackageId,
        name: "Test Section Alpha",
        description: "Testing section creation",
        icon: "Cpu",
      }),
    });
    expect(res.status).toBe(201);
    const section = await res.json();
    createdSectionId = section.id;
    expect(section.name).toBe("Test Section Alpha");
  });

  it("7. should add URL with tag and detect duplicates", async () => {
    // Add URL
    const addRes = await fetch(`${BASE_URL}/api/urls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        packageId: createdPackageId,
        sectionId: createdSectionId,
        url: "https://vitest.dev/guide/",
        title: "Vitest Guide",
        description: "Documentation guide",
        isFavorite: true,
        tags: ["testing", "e2e"],
      }),
    });
    expect(addRes.status).toBe(201);
    const urlItem = await addRes.json();
    createdUrlId = urlItem.id;
    expect(urlItem.title).toBe("Vitest Guide");

    // Test duplicate detection
    const dupRes = await fetch(`${BASE_URL}/api/urls/check-duplicate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        url: "https://vitest.dev/guide/",
      }),
    });
    expect(dupRes.status).toBe(200);
    const dupData = await dupRes.json();
    expect(dupData.isDuplicate).toBe(true);
    expect(dupData.existing.packageName).toBe("E2E Live Test Package");
  });

  it("8. should search across packages, sections, and URLs", async () => {
    const searchRes = await fetch(`${BASE_URL}/api/search?q=Vitest`, {
      headers: { Cookie: sessionCookie },
    });
    expect(searchRes.status).toBe(200);
    const searchResults = await searchRes.json();
    expect(searchResults.urls.some((u: any) => u.title.includes("Vitest"))).toBe(true);
  });

  it("9. should export data as Netscape HTML and JSON", async () => {
    const htmlRes = await fetch(`${BASE_URL}/api/import-export/export?format=html`, {
      headers: { Cookie: sessionCookie },
    });
    expect(htmlRes.status).toBe(200);
    const html = await htmlRes.text();
    expect(html).toContain("<!DOCTYPE NETSCAPE-Bookmark-file-1>");

    const jsonRes = await fetch(`${BASE_URL}/api/import-export/export?format=json`, {
      headers: { Cookie: sessionCookie },
    });
    expect(jsonRes.status).toBe(200);
    const json = await jsonRes.json();
    expect(Array.isArray(json)).toBe(true);
  });

  it("10. should clean up created test package", async () => {
    const deleteRes = await fetch(`${BASE_URL}/api/packages/${createdPackageId}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookie },
    });
    expect(deleteRes.status).toBe(200);
  });
});
