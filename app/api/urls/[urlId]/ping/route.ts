import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateSafeUrl } from "@/lib/ssrf";

interface RouteParams {
  params: Promise<{ urlId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { urlId } = await params;

    const existing = await db.url.findFirst({
      where: { id: urlId, userId: user.id },
      select: { id: true, url: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    const check = await validateSafeUrl(existing.url);
    if (!check.safe || !check.url) {
      return NextResponse.json({
        isAlive: false,
        status: 400,
        responseTimeMs: 0,
        reason: check.reason || "Unsafe URL destination",
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const start = performance.now();

    try {
      let response = await fetch(check.url.href, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "LinkStack-HealthCheck/1.0",
        },
        redirect: "manual",
      });

      // If HEAD is rejected with 405 Method Not Allowed, fallback to minimal GET
      if (response.status === 405) {
        response = await fetch(check.url.href, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": "LinkStack-HealthCheck/1.0",
          },
          redirect: "manual",
        });
      }

      const elapsed = Math.round(performance.now() - start);
      const isAlive = response.status >= 200 && response.status < 400;

      return NextResponse.json({
        isAlive,
        status: response.status,
        responseTimeMs: elapsed,
      });
    } catch {
      const elapsed = Math.round(performance.now() - start);
      return NextResponse.json({
        isAlive: false,
        status: 0,
        responseTimeMs: elapsed,
        reason: "Connection failed or timed out",
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: unknown) {
    console.error("GET /api/urls/[urlId]/ping error:", err);
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
