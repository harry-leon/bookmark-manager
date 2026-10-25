import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/reminders
 *
 * Protected cron endpoint. Processes due reminders in bounded batches.
 * Call this from an external cron service (e.g. cron-job.org) every minute.
 *
 * Authentication: x-cron-secret header must match CRON_SECRET env var.
 *
 * Setup example (cron-job.org):
 *   URL: https://yourdomain.com/api/cron/reminders
 *   Method: POST
 *   Headers: x-cron-secret: <your CRON_SECRET>
 *   Schedule: Every 1 minute
 */
export async function POST(req: Request) {
  // ── Auth ───────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("CRON_SECRET not set — reminders cron endpoint is disabled.");
    return NextResponse.json({ error: "Cron endpoint not configured" }, { status: 503 });
  }

  const providedSecret = req.headers.get("x-cron-secret");
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Process reminders ──────────────────────────────────────────────────
  try {
    const now = new Date();
    const BATCH_SIZE = 50;

    // Find tasks whose reminder is due and not yet sent, and not DONE
    const eligibleTasks = await db.task.findMany({
      where: {
        reminderAt:     { lte: now },
        reminderSentAt: null,
        status:         { not: "DONE" },
      },
      take: BATCH_SIZE,
      select: { id: true, userId: true, title: true, dueAt: true },
    });

    if (eligibleTasks.length === 0) {
      return NextResponse.json({ processed: 0, message: "No reminders due" });
    }

    // Mark reminders as sent (idempotent — uses reminderSentAt IS NULL check)
    const taskIds = eligibleTasks.map((t) => t.id);

    const result = await db.task.updateMany({
      where: {
        id:             { in: taskIds },
        reminderSentAt: null, // Idempotent guard
        status:         { not: "DONE" },
      },
      data: { reminderSentAt: now },
    });

    // In a full implementation, this is where you'd send push notifications
    // or emails. For now, the reminderSentAt flag lets the UI show "Due!" badges.
    console.log(`[cron/reminders] Processed ${result.count} reminders at ${now.toISOString()}`);

    return NextResponse.json({
      processed: result.count,
      taskIds,
      processedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("[cron/reminders] Error:", err);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
