/**
 * Centralized quota configuration.
 * All limits can be overridden via environment variables.
 * Change defaults here; do NOT hardcode limits in business logic.
 */
export const QUOTA_DEFAULTS = {
  packages:              Number(process.env.QUOTA_PACKAGES              ?? 100),
  sections:              Number(process.env.QUOTA_SECTIONS              ?? 500),
  urls:                  Number(process.env.QUOTA_URLS                  ?? 10_000),
  notes:                 Number(process.env.QUOTA_NOTES                 ?? 2_000),
  noteCharacters:        Number(process.env.QUOTA_NOTE_CHARS            ?? 50_000),
  tags:                  Number(process.env.QUOTA_TAGS                  ?? 500),
  tasks:                 Number(process.env.QUOTA_TASKS                 ?? 5_000),
  imagesPerNote:         Number(process.env.QUOTA_IMAGES_PER_NOTE       ?? 10),
  maxImageBytes:         Number(process.env.QUOTA_MAX_IMAGE_BYTES       ?? 5 * 1024 * 1024),    // 5 MB
  maxImageWidth:         Number(process.env.QUOTA_MAX_IMAGE_WIDTH       ?? 6000),
  maxImageHeight:        Number(process.env.QUOTA_MAX_IMAGE_HEIGHT      ?? 6000),
  totalAttachments:      Number(process.env.QUOTA_TOTAL_ATTACHMENTS     ?? 500),
  totalAttachmentBytes:  Number(process.env.QUOTA_TOTAL_ATTACHMENT_BYTES ?? 250 * 1024 * 1024), // 250 MB
  importFileSizeBytes:   Number(process.env.QUOTA_IMPORT_FILE_BYTES     ?? 10 * 1024 * 1024),  // 10 MB
  importMaxRecords:      Number(process.env.QUOTA_IMPORT_MAX_RECORDS    ?? 10_000),
} as const;

export type QuotaKey = keyof typeof QUOTA_DEFAULTS;
