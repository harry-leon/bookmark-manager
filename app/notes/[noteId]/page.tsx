"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/top-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye, Edit3, Trash2, Upload, X, ExternalLink, Loader2, Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface AttachmentItem {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  signedUrl: string | null;
  createdAt: string;
}

interface NoteData {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  url: { id: string; url: string; title: string; packageId: string; sectionId?: string | null };
  attachments: AttachmentItem[];
}

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.noteId as string;

  const [note, setNote]           = useState<NoteData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [title, setTitle]         = useState("");
  const [content, setContent]     = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [previewMode, setPreviewMode] = useState(false);
  const [isDragging, setIsDragging]   = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [deleteNoteOpen, setDeleteNoteOpen] = useState(false);

  const debouncedTitle   = useDebounce(title,   1500);
  const debouncedContent = useDebounce(content, 1500);
  const hasChanges       = useRef(false);
  const fileInputRef     = useRef<HTMLInputElement>(null);

  // ── Load note ────────────────────────────────────────────────────────────
  useEffect(() => {
    loadNote();
  }, [noteId]);

  async function loadNote() {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) {
        toast.error("Note not found");
        router.push("/notes");
        return;
      }
      const data: NoteData = await res.json();
      setNote(data);
      setTitle(data.title);
      setContent(data.content);
      hasChanges.current = false;
      setSaveStatus("saved");
    } catch {
      toast.error("Failed to load note");
    } finally {
      setLoading(false);
    }
  }

  // ── Auto-save ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasChanges.current) return;
    setSaveStatus("saving");
    const controller = new AbortController();
    fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: debouncedTitle, content: debouncedContent }),
      signal: controller.signal,
    })
      .then((res) => {
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
          toast.error("Failed to save note");
        }
      })
      .catch(() => {
        setSaveStatus("unsaved");
      });
    return () => controller.abort();
  }, [debouncedTitle, debouncedContent, noteId]);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    hasChanges.current = true;
    setSaveStatus("unsaved");
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    hasChanges.current = true;
    setSaveStatus("unsaved");
  }

  // ── Image upload ─────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error(`File too large. Maximum is 5 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB)`);
      return;
    }

    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) {
      toast.error(`Unsupported type "${file.type}". Allowed: JPEG, PNG, WebP, GIF.`);
      return;
    }

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}…`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/notes/${noteId}/attachments`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.code === "QUOTA_EXCEEDED") {
          toast.error(`Quota exceeded: ${data.error.message}`);
        } else {
          toast.error(data.error || "Upload failed");
        }
        return;
      }

      // Append image markdown into content
      const mdImage = `\n![${file.name}](attachment:${data.id})\n`;
      setContent((prev) => prev + mdImage);
      hasChanges.current = true;
      setSaveStatus("unsaved");

      // Refresh note attachments
      setNote((prev) =>
        prev
          ? {
              ...prev,
              attachments: [
                ...prev.attachments,
                {
                  id: data.id,
                  originalFilename: data.originalFilename,
                  mimeType: data.mimeType,
                  sizeBytes: data.sizeBytes,
                  width: data.width,
                  height: data.height,
                  signedUrl: data.signedUrl,
                  createdAt: data.createdAt,
                },
              ],
            }
          : prev
      );

      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }, [noteId]);

  // ── Drag and drop ─────────────────────────────────────────────────────────
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave() { setIsDragging(false); }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  // ── Clipboard paste ───────────────────────────────────────────────────────
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) uploadFile(file);
      }
    },
    [uploadFile]
  );

  // ── Delete attachment ─────────────────────────────────────────────────────
  async function deleteAttachmentItem(attachmentId: string) {
    try {
      const res = await fetch(`/api/notes/${noteId}/attachments/${attachmentId}`, { method: "DELETE" });
      if (res.ok) {
        setNote((prev) =>
          prev ? { ...prev, attachments: prev.attachments.filter((a) => a.id !== attachmentId) } : prev
        );
        toast.success("Image deleted");
      } else {
        toast.error("Failed to delete image");
      }
    } catch {
      toast.error("Failed to delete image");
    }
  }

  // ── Delete note ───────────────────────────────────────────────────────────
  async function deleteNote() {
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Note deleted");
        router.push("/notes");
      } else {
        toast.error("Failed to delete note");
      }
    } catch {
      toast.error("Failed to delete note");
    }
  }

  // ── Render markdown with signed URLs ─────────────────────────────────────
  function resolveAttachmentSrc(src: string): string {
    if (src.startsWith("attachment:")) {
      const id = src.slice("attachment:".length);
      const att = note?.attachments.find((a) => a.id === id);
      return att?.signedUrl ?? src;
    }
    return src;
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopHeader breadcrumbs={[{ label: "Notes", href: "/notes" }, { label: "Loading…" }]} />
        <div className="p-4 md:p-6 lg:p-8 w-full space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="flex flex-col min-h-screen pb-10">
      <TopHeader
        breadcrumbs={[
          { label: "Notes", href: "/notes" },
          { label: note.title || "Untitled Note" },
        ]}
      />

      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full space-y-4">
        {/* Linked URL */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <a href={note.url.url} target="_blank" rel="noopener noreferrer"
            className="hover:underline truncate max-w-sm">
            {note.url.title || note.url.url}
          </a>
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title…"
          className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5">
            <Button
              variant={previewMode ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setPreviewMode(false)}
              className="h-7 text-xs gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant={previewMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode(true)}
              className="h-7 text-xs gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Save status */}
            <span className={cn("text-[11px] font-mono", {
              "text-muted-foreground": saveStatus === "saved",
              "text-amber-500 animate-pulse": saveStatus === "saving" || saveStatus === "unsaved",
            })}>
              {saveStatus === "saved" ? "✓ saved" : saveStatus === "saving" ? "saving…" : "● unsaved"}
            </span>

            {/* Upload button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-7 text-xs gap-1.5"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploadProgress ?? "Upload Image"}
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteNoteOpen(true)}
              title="Delete note"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
        />

        {/* Editor / Preview */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "min-h-[400px] rounded-lg border transition-colors",
            isDragging ? "border-primary border-dashed bg-primary/5" : "border-border/50"
          )}
        >
          {previewMode ? (
            <div className="prose prose-sm dark:prose-invert max-w-none p-4">
              {content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img({ src, alt }) {
                      const resolved = resolveAttachmentSrc(src ?? "");
                      return (
                        <img
                          src={resolved}
                          alt={alt ?? ""}
                          className="max-w-full rounded-lg border border-border/40"
                        />
                      );
                    },
                    a({ href, children }) {
                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground text-sm italic">Nothing to preview. Write some Markdown.</p>
              )}
            </div>
          ) : (
            <TextareaAutosize
              value={content}
              onChange={handleContentChange}
              onPaste={handlePaste}
              placeholder={
                isDragging
                  ? "Drop image here…"
                  : "Write your note in Markdown… Paste or drop images to upload."
              }
              minRows={16}
              className="w-full resize-none bg-transparent p-4 font-mono text-sm outline-none placeholder:text-muted-foreground/40"
            />
          )}
        </div>

        {/* Attached images panel */}
        {note.attachments.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Attached Images ({note.attachments.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {note.attachments.map((att) => (
                <div
                  key={att.id}
                  className="group relative rounded-lg border border-border/50 overflow-hidden bg-muted/20 aspect-video flex items-center justify-center"
                >
                  {att.signedUrl ? (
                    <img
                      src={att.signedUrl}
                      alt={att.originalFilename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  )}
                  {/* Delete overlay */}
                  <button
                    onClick={() => deleteAttachmentItem(att.id)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {att.originalFilename}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteNoteOpen}
        onOpenChange={setDeleteNoteOpen}
        title="Delete this note?"
        description="This will permanently delete the note and all its attached images. This action cannot be undone."
        confirmLabel="Delete Note"
        onConfirm={deleteNote}
      />
    </div>
  );
}
