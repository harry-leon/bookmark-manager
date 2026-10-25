"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TopHeader } from "@/components/layout/top-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { Plus, FileText, ExternalLink, Image as ImageIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteDialog } from "@/features/notes/note-dialog";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  url: { id: string; url: string; title: string; packageId: string };
  _count: { attachments: number };
}

function NotesContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const urlId        = searchParams.get("urlId");

  const [notes, setNotes]           = useState<NoteItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [urlId]);

  async function loadNotes() {
    setLoading(true);
    try {
      const qs  = urlId ? `?urlId=${urlId}&limit=100` : "?limit=100";
      const res = await fetch(`/api/notes${qs}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
        setTotal(data.total);
      }
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopHeader
        breadcrumbs={[{ label: "Notes" }]}
        action={{
          label: "New Note",
          onClick: () => setNoteDialogOpen(true),
          icon: Plus,
        }}
        onOpenCommandPalette={() =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true })
          )
        }
      />

      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full space-y-4">
        {urlId && (
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-card/40 text-xs">
            <span className="text-muted-foreground">
              Showing notes for URL <span className="font-mono text-foreground font-medium">{urlId}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => router.push("/notes")} className="h-6 text-xs">
              Clear filter
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No notes yet"
            description="Create rich notes with Markdown and image attachments linked to your bookmarks."
            actionLabel="Create First Note"
            onAction={() => setNoteDialogOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="group flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl border border-border/50 bg-card/40 hover:bg-card hover:border-border hover:shadow-xs transition-all"
              >
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                  <div className="mt-0.5 h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {note.title || "Untitled Note"}
                      </span>
                      {note._count.attachments > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-mono text-muted-foreground bg-muted/50 px-1 rounded">
                          <ImageIcon className="h-2.5 w-2.5" />
                          {note._count.attachments}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground/70 flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[140px] xs:max-w-[220px] sm:max-w-xs">{note.url.title || note.url.url}</span>
                      </span>
                    </div>
                    {note.content && (
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                        {note.content.slice(0, 120)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono hidden xs:inline">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        defaultUrlId={urlId}
        onSuccess={loadNotes}
      />
    </div>
  );
}

export default function NotesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col min-h-screen">
          <TopHeader breadcrumbs={[{ label: "Notes" }]} />
          <div className="p-4 md:p-6 lg:p-8 w-full space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      }
    >
      <NotesContent />
    </React.Suspense>
  );
}

