import { withAuth } from "next-auth/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Protected app paths requiring NextAuth session
const authMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
});

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Anti-DoS Protection for API routes: Apply global sliding-window rate limit (60 req/min per IP)
  if (pathname.startsWith("/api/")) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    // Allow cron endpoint with authorization header without strict IP rate-limiting
    const isCron = pathname.startsWith("/api/cron/");
    if (!isCron) {
      const rl = checkRateLimit(`global-api:${ip}`, 60, 60 * 1000);
      if (!rl.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please slow down your requests.",
            retryAfter: rl.resetIn,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(rl.resetIn),
              "X-RateLimit-Limit": "60",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(rl.resetIn),
            },
          }
        );
      }
    }
    return NextResponse.next();
  }

  // 2. NextAuth Session Guard for protected application pages
  return (authMiddleware as any)(req);
}

export const config = {
  matcher: [
    "/packages/:path*",
    "/urls/:path*",
    "/favorites/:path*",
    "/import-export/:path*",
    "/notes/:path*",
    "/tasks/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
