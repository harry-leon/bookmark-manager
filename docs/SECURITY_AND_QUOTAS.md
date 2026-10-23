# LinkNest — Security, Quotas, and Resource Protection

## 1. Authentication & Multi-Tenant Isolation
- **Authentication**: Powered by NextAuth with JWT strategy.
- **User Scoping**: Every database query for `Package`, `Section`, `Url`, `Tag`, `Note`, `Attachment`, and `Task` must enforce `userId: user.id`.
- **Resource Ownership Verification**: When associating nested resources (e.g., linking a note to a URL or a task to a package), the server checks that the parent entity belongs to the requesting user before committing.

---

## 2. SSRF Protection & Server-Side Fetching (`lib/ssrf.ts`)
When fetching remote website metadata (favicon, title, description):
- **Protocol Restriction**: Only `http:` and `https:` schemes are accepted.
- **Private & Loopback Filtering**: All IPs matching loopback (`127.0.0.0/8`, `::1`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`), link-local/cloud metadata (`169.254.0.0/16`, `fe80::/10`), broadcast, and multicast are strictly blocked.
- **DNS Resolution Check**: Hostnames are resolved through system DNS before any connection is attempted to prevent DNS rebinding.
- **Redirect Validation**: HTTP redirects (301, 302, 307, 308) are followed manually up to 3 hops, re-verifying every target destination with `validateSafeUrl`.
- **Bounded Request Limits**: Maximum response size is capped at 512 KB, with a strict 4-second timeout.

---

## 3. Object Storage Security & Validation (`lib/storage/`)
- **No Direct Public Bucket**: Object storage (Cloudflare R2 or S3) is private. No permanent public URLs exist for attachments.
- **Short-Lived Presigned URLs**: Read access is granted via authenticated API calls generating short-lived signed URLs (default: 15 minutes).
- **MIME & Magic-Byte Verification**: Uploaded buffers are inspected using magic byte signatures (`image/jpeg`, `image/png`, `image/webp`, `image/gif`). Client-provided `Content-Type` headers are cross-verified.
- **Opaque Storage Keys**: Storage keys are generated server-side using secure CUIDs (`attachments/{userId}/{noteId}/{cuid}.ext`), preventing enumeration and path traversal.
- **De-referencing & Cleanup**: Deleting a note cascades to its attachment records and issues object deletion requests to the object store.

---

## 4. Quota Enforcement (`lib/quotas/`)
All resource limits are centralized in `lib/quotas/limits.ts` with environment variable overrides:

| Resource | Default Quota | Override Variable |
|---|---|---|
| Packages | 100 | `QUOTA_PACKAGES` |
| Sections | 500 | `QUOTA_SECTIONS` |
| URLs | 10,000 | `QUOTA_URLS` |
| Notes | 2,000 | `QUOTA_NOTES` |
| Note Characters | 50,000 | `QUOTA_NOTE_CHARS` |
| Tags | 500 | `QUOTA_TAGS` |
| Tasks | 5,000 | `QUOTA_TASKS` |
| Images per Note | 10 | `QUOTA_IMAGES_PER_NOTE` |
| Max Image Size | 5 MB | `QUOTA_MAX_IMAGE_BYTES` |
| Image Dimensions | 6,000 × 6,000 px | `QUOTA_MAX_IMAGE_WIDTH`, `_HEIGHT` |
| Total Attachment Count | 500 | `QUOTA_TOTAL_ATTACHMENTS` |
| Total Attachment Storage | 250 MB | `QUOTA_TOTAL_ATTACHMENT_BYTES` |
| Import File Size | 10 MB | `QUOTA_IMPORT_FILE_BYTES` |
| Import Records Batch | 10,000 | `QUOTA_IMPORT_MAX_RECORDS` |

When a limit is reached, API routes respond with HTTP 429 and standard error envelope:
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Your attachment_storage limit has been reached.",
    "resource": "attachment_storage",
    "limit": 262144000,
    "used": 262144000,
    "requested": 1048576,
    "remaining": 0
  }
}
```

---

## 5. Scheduled Processing & Cron Security (`/api/cron/reminders`)
- **Authentication**: Requires the `x-cron-secret` HTTP header matching `process.env.CRON_SECRET`.
- **Idempotency**: Tasks are queried with `reminderAt <= now() AND reminderSentAt IS NULL AND status != 'DONE'`. Updating sets `reminderSentAt = now()`. Missed runs or retries do not send duplicate reminders.
