import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { QUOTA_DEFAULTS, QuotaKey } from "./limits";

export interface QuotaCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Check if a user has quota remaining for a given resource.
 * Queries the actual database for counts rather than relying on cached counters.
 */
export async function checkQuota(
  userId: string,
  resource: QuotaKey,
  requested = 1
): Promise<QuotaCheckResult> {
  const limit = QUOTA_DEFAULTS[resource];
  let used = 0;

  switch (resource) {
    case "packages":
      used = await db.package.count({ where: { userId } });
      break;
    case "sections":
      used = await db.section.count({ where: { package: { userId } } });
      break;
    case "urls":
      used = await db.url.count({ where: { userId } });
      break;
    case "notes":
      used = await db.note.count({ where: { userId } });
      break;
    case "tags":
      used = await db.tag.count({ where: { userId } });
      break;
    case "tasks":
      used = await db.task.count({ where: { userId } });
      break;
    case "totalAttachments":
      used = await db.attachment.count({ where: { userId } });
      break;
    case "totalAttachmentBytes": {
      const agg = await db.attachment.aggregate({
        where: { userId },
        _sum: { sizeBytes: true },
      });
      used = agg._sum.sizeBytes ?? 0;
      break;
    }
    default:
      // Numeric limits like maxImageBytes, imagesPerNote, etc. are checked
      // inline at the call site rather than via DB query.
      return { allowed: true, used: 0, limit, remaining: limit };
  }

  const allowed = used + requested <= limit;
  return { allowed, used, limit, remaining: Math.max(0, limit - used) };
}

/**
 * Check how many images a specific note already has.
 */
export async function checkNoteImageQuota(
  noteId: string,
  requested = 1
): Promise<QuotaCheckResult> {
  const limit = QUOTA_DEFAULTS.imagesPerNote;
  const used = await db.attachment.count({ where: { noteId } });
  const allowed = used + requested <= limit;
  return { allowed, used, limit, remaining: Math.max(0, limit - used) };
}

/**
 * Returns a standardised QUOTA_EXCEEDED JSON response.
 */
export function quotaExceededResponse(
  resource: string,
  limit: number,
  used: number,
  requested: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "QUOTA_EXCEEDED",
        message: `Your ${resource} limit has been reached.`,
        resource,
        limit,
        used,
        requested,
        remaining: Math.max(0, limit - used),
      },
    },
    { status: 429 }
  );
}
