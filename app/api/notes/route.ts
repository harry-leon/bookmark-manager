import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { checkQuota, quotaExceededResponse } from "@/lib/quotas/quota-service";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const createNoteSchema = z.object({
  urlId:   z.string().min(1, "urlId is required"),
  title:   z.string().max(255).default(""),
  content: z.string().max(50_000, "Note content exceeds 50,000 characters").default(""),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const urlId = searchParams.get("urlId");
    const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where = urlId
      ? { userId: user.id, urlId }
      : { userId: user.id };

    const [total, notes] = await Promise.all([
      db.note.count({ where }),
      db.note.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          url: { select: { id: true, url: true, title: true, packageId: true } },
          _count: { select: { attachments: true } },
        },
      }),
    ]);

    return NextResponse.json({ total, notes, hasMore: offset + notes.length < total });
  } catch (err) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = checkRateLimit(`notes:create:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Rate limit exceeded. Retry in ${rl.resetIn}s.` }, { status: 429 });
    }

    const body = await req.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
    }

    const { urlId, title, content } = parsed.data;

    // Verify URL ownership
    const urlRecord = await db.url.findFirst({ where: { id: urlId, userId: user.id } });
    if (!urlRecord) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    // Quota check
    const quota = await checkQuota(user.id, "notes");
    if (!quota.allowed) {
      return quotaExceededResponse("notes", quota.limit, quota.used, 1);
    }

    const note = await db.note.create({
      data: { userId: user.id, urlId, title, content },
      include: {
        url: { select: { id: true, url: true, title: true } },
        _count: { select: { attachments: true } },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("POST /api/notes error:", err);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
