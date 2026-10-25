import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { extractMetadata } from "@/lib/metadata";
import { normalizeUrl } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(`metadata:${user.id}`, 30, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const normalized = normalizeUrl(url);
    const metadata = await extractMetadata(normalized);

    return NextResponse.json(metadata);
  } catch (err: unknown) {
    console.error("Metadata extraction error:", err);
    // Graceful fallback: Never fail URL save on metadata error
    return NextResponse.json({
      title: "",
      description: "",
      faviconUrl: "",
    });
  }
}
