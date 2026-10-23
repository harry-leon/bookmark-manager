# LinkNest — Full-Stack MVP Implementation Specification & Architecture

## 1. Project Mission & Overview
LinkNest is a personal resource management application built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma ORM, and NextAuth.

### Core Resource Hierarchy
`Package` → `Section` → `URL`

### Auxiliary Subsystems
- **Notes & Media Attachments**: Markdown notes associated with URLs, with raster image upload (JPEG, PNG, WebP, GIF) and clipboard paste stored in private S3/R2 object storage with time-limited presigned URLs.
- **Tasks & Reminders**: Tasks with priorities (`LOW`, `MEDIUM`, `HIGH`), statuses (`TODO`, `IN_PROGRESS`, `DONE`), due dates, and persistent server-side reminder scheduling processed in batches via a secured cron route.
- **Storage Quotas & Accounting**: Centralized limits for packages, sections, URLs, notes, tags, tasks, attachments, and total storage bytes.
- **Global Search**: Command palette (Ctrl+K / Cmd+K) performing scoped, debounced, rate-limited search across packages, sections, URLs, tags, notes, and tasks.
- **Import & Export**: Browser bookmark HTML (Netscape) import/export and versioned LinkNest JSON backup/restore.

---

## 2. Architecture & File Structure

```
├── app/
│   ├── (public pages: /about, /intro, /login, /register, /privacy)
│   ├── api/
│   │   ├── auth/
│   │   ├── cron/reminders/route.ts       # Protected cron job endpoint
│   │   ├── import-export/
│   │   │   ├── export/route.ts           # HTML + versioned JSON export
│   │   │   └── import/route.ts           # HTML + LinkNest JSON import
│   │   ├── metadata/route.ts             # SSRF-protected metadata fetcher
│   │   ├── notes/
│   │   │   ├── route.ts                  # GET/POST notes
│   │   │   └── [noteId]/
│   │   │       ├── route.ts              # GET/PATCH/DELETE note
│   │   │       └── attachments/
│   │   │           ├── route.ts          # POST image upload
│   │   │           └── [attachmentId]/   # DELETE / GET signed URL
│   │   ├── packages/                     # Package CRUD
│   │   ├── search/route.ts               # Scoped multi-entity search
│   │   ├── sections/                     # Section CRUD
│   │   ├── tasks/
│   │   │   ├── route.ts                  # GET/POST tasks
│   │   │   └── [taskId]/route.ts         # GET/PATCH/DELETE task
│   │   ├── urls/                         # URL CRUD, batch, click, ping
│   │   └── user/quota/route.ts           # Quota accounting endpoint
│   ├── favorites/page.tsx
│   ├── import-export/page.tsx
│   ├── notes/
│   │   ├── page.tsx                      # Notes browser
│   │   └── [noteId]/page.tsx             # Markdown editor with image upload
│   ├── packages/
│   ├── settings/quota/page.tsx           # Storage quota dashboard
│   ├── tasks/page.tsx                    # Tasks manager & filter tabs
│   └── urls/page.tsx
├── features/
│   ├── packages/
│   ├── sections/
│   ├── tasks/
│   │   └── task-dialog.tsx               # Task create/edit dialog
│   └── urls/
│       └── url-card.tsx                  # URL item with notes & actions
├── lib/
│   ├── auth.ts                           # NextAuth configuration
│   ├── bookmarks-parser.ts               # Netscape HTML parser/exporter
│   ├── cache.ts                          # In-memory TTL cache
│   ├── db.ts                             # Prisma singleton
│   ├── quotas/
│   │   ├── limits.ts                     # Configurable defaults & env overrides
│   │   └── quota-service.ts              # Database-driven quota enforcement
│   ├── rate-limit.ts                     # Sliding-window rate limiter
│   ├── ssrf.ts                           # DNS validation & safe fetch
│   ├── storage/
│   │   ├── attachment-validator.ts       # MIME, magic-byte & size validation
│   │   └── storage-service.ts            # S3/R2 client & presigned URLs
│   └── utils.ts
└── prisma/
    └── schema.prisma                     # Complete data models
```
