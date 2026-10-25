"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InputHelpTooltip } from "@/components/shared/input-help-tooltip";
import { toast } from "sonner";
import { FileText, ExternalLink, Plus } from "lucide-react";

interface UrlOption {
  id: string;
  url: string;
  title: string;
  packageName?: string;
  sectionName?: string;
}

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUrlId?: string | null;
  onSuccess?: () => void;
}

export function NoteDialog({
  open,
  onOpenChange,
  defaultUrlId,
  onSuccess,
}: NoteDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [urls, setUrls] = useState<UrlOption[]>([]);
  const [selectedUrlId, setSelectedUrlId] = useState<string>(defaultUrlId || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setSelectedUrlId(defaultUrlId || "");
      loadUrls();
    }
  }, [open, defaultUrlId]);

  async function loadUrls() {
    setLoadingUrls(true);
    try {
      const res = await fetch("/api/urls?limit=100");
      if (res.ok) {
        const data = await res.json();
        const mapped: UrlOption[] = (data.urls || []).map((u: any) => ({
          id: u.id,
          url: u.url,
          title: u.title || u.url,
          packageName: u.section?.package?.name,
          sectionName: u.section?.name,
        }));
        setUrls(mapped);
        if (!selectedUrlId && mapped.length > 0 && !defaultUrlId) {
          setSelectedUrlId(mapped[0].id);
        }
      }
    } catch {
      toast.error("Failed to load URLs");
    } finally {
      setLoadingUrls(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUrlId) {
      toast.error("Please select a URL to attach this note to");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urlId: selectedUrlId,
          title: title.trim() || "Untitled Note",
          content: content.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || "Failed to create note");
      }

      toast.success("Note created successfully");
      onOpenChange(false);
      onSuccess?.();
      router.push(`/notes/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create note";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const selectedUrl = urls.find((u) => u.id === selectedUrlId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Create New Note</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 pt-1">
            {/* Target URL Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Linked Bookmark / URL <span className="text-destructive">*</span>
                </label>
                <InputHelpTooltip
                  content="Notes are attached to a specific URL in LinkNest. You can attach multiple notes to the same URL."
                  example="Select the URL or bookmark you want to take notes on."
                />
              </div>

              {loadingUrls ? (
                <div className="h-9 w-full rounded-md border border-input bg-muted/40 animate-pulse flex items-center px-3 text-xs text-muted-foreground">
                  Loading URLs…
                </div>
              ) : urls.length === 0 ? (
                <div className="p-3 rounded-lg border border-dashed border-border bg-muted/20 text-xs text-center space-y-2">
                  <p className="text-muted-foreground">
                    No URLs found in your library yet.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => {
                      onOpenChange(false);
                      window.dispatchEvent(new CustomEvent("open-new-url"));
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add your first URL</span>
                  </Button>
                </div>
              ) : (
                <select
                  value={selectedUrlId}
                  onChange={(e) => setSelectedUrlId(e.target.value)}
                  required
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {urls.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.title} {u.packageName ? `(${u.packageName})` : ""}
                    </option>
                  ))}
                </select>
              )}

              {selectedUrl && (
                <p className="text-[11px] text-muted-foreground/70 truncate flex items-center gap-1 mt-1">
                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{selectedUrl.url}</span>
                </p>
              )}
            </div>

            {/* Note Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Note Title
                </label>
                <InputHelpTooltip
                  content="A descriptive title for your note."
                  example="Key findings, Setup instructions, API Cheat sheet"
                />
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Documentation summary, Setup notes…"
                className="h-9 text-xs"
                autoFocus
              />
            </div>

            {/* Note Content / Markdown Initial Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Initial Content (Optional)
                </label>
                <InputHelpTooltip
                  content="You can start typing markdown notes now, or write and paste images directly in the full editor."
                  example="# Summary\n- Point 1\n- Point 2"
                />
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note in Markdown… (You can paste and attach images in the editor)"
                rows={4}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || urls.length === 0}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{loading ? "Creating…" : "Create & Open Note"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
