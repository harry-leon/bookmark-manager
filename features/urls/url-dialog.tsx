"use client";

import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { FaviconImage } from "@/components/shared/favicon-image";
import {
  Star,
  Sparkles,
  AlertTriangle,
  Link2,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { isValidUrl, normalizeUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { InputHelpTooltip } from "@/components/shared/input-help-tooltip";

interface PackageOption {
  id: string;
  name: string;
  color: string;
  sections: Array<{ id: string; name: string }>;
}

interface UrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPackageId?: string;
  defaultSectionId?: string | null;
  urlItem?: {
    id: string;
    url: string;
    title: string;
    description?: string | null;
    faviconUrl?: string | null;
    isFavorite: boolean;
    packageId: string;
    sectionId?: string | null;
    urlTags?: Array<{ tag: { name: string } }>;
  } | null;
  onSuccess?: () => void;
}

export function UrlDialog({
  open,
  onOpenChange,
  defaultPackageId,
  defaultSectionId,
  urlItem,
  onSuccess,
}: UrlDialogProps) {
  const isEditing = Boolean(urlItem);

  const [rawUrl, setRawUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    packageName: string;
    sectionName?: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadPackages();
      if (urlItem) {
        setRawUrl(urlItem.url);
        setTitle(urlItem.title);
        setDescription(urlItem.description || "");
        setFaviconUrl(urlItem.faviconUrl || "");
        setIsFavorite(urlItem.isFavorite || false);
        setPackageId(urlItem.packageId);
        setSectionId(urlItem.sectionId || null);
        setTags(urlItem.urlTags?.map((ut) => ut.tag.name) || []);
        setDuplicateWarning(null);
      } else {
        setRawUrl("");
        setTitle("");
        setDescription("");
        setFaviconUrl("");
        setIsFavorite(false);
        setPackageId(defaultPackageId || "");
        setSectionId(defaultSectionId || null);
        setTags([]);
        setDuplicateWarning(null);
      }
    }
  }, [open, urlItem, defaultPackageId, defaultSectionId]);

  async function loadPackages() {
    try {
      const res = await fetch("/api/packages?sort=order");
      if (res.ok) {
        const pkgs = await res.json();
        // Load details with sections for each package
        const fullPkgs: PackageOption[] = [];
        for (const p of pkgs) {
          const detailRes = await fetch(`/api/packages/${p.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            fullPkgs.push({
              id: detail.id,
              name: detail.name,
              color: detail.color,
              sections: detail.sections.map((s: any) => ({
                id: s.id,
                name: s.name,
              })),
            });
          }
        }
        setPackages(fullPkgs);
        if (!packageId && fullPkgs.length > 0) {
          setPackageId(defaultPackageId || fullPkgs[0].id);
        }
      }
    } catch {
      // ignore
    }
  }

  // Handle URL change & auto metadata extraction
  async function handleUrlBlur() {
    if (!rawUrl.trim() || !isValidUrl(normalizeUrl(rawUrl))) return;

    const normalized = normalizeUrl(rawUrl);
    setRawUrl(normalized);

    // Check duplicate
    if (!isEditing) {
      try {
        const dupRes = await fetch("/api/urls/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalized }),
        });
        if (dupRes.ok) {
          const dupData = await dupRes.json();
          if (dupData.isDuplicate) {
            setDuplicateWarning({
              packageName: dupData.existing.packageName,
              sectionName: dupData.existing.sectionName,
            });
          } else {
            setDuplicateWarning(null);
          }
        }
      } catch {
        // ignore
      }
    }

    // Auto fetch metadata if title is empty
    if (!title.trim()) {
      setFetchingMeta(true);
      try {
        const metaRes = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalized }),
        });
        if (metaRes.ok) {
          const meta = await metaRes.json();
          if (meta.title && !title) setTitle(meta.title);
          if (meta.description && !description) setDescription(meta.description);
          if (meta.faviconUrl && !faviconUrl) setFaviconUrl(meta.faviconUrl);
        }
      } catch {
        // ignore failure - non blocking
      } finally {
        setFetchingMeta(false);
      }
    }
  }

  function handleAddTag() {
    const clean = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rawUrl.trim()) {
      toast.error("URL is required");
      return;
    }

    const normalized = normalizeUrl(rawUrl);
    if (!isValidUrl(normalized)) {
      toast.error("Please enter a valid HTTP or HTTPS URL");
      return;
    }

    if (!packageId) {
      toast.error("Please select a package");
      return;
    }

    setSaving(true);
    try {
      const url = isEditing ? `/api/urls/${urlItem?.id}` : "/api/urls";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalized,
          title: title.trim() || normalized,
          description: description.trim() || null,
          faviconUrl: faviconUrl.trim() || null,
          isFavorite,
          packageId,
          sectionId: sectionId || null,
          tags,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save URL");
      }

      toast.success(isEditing ? "URL updated" : "URL saved");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save URL";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const selectedPkg = packages.find((p) => p.id === packageId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-base font-semibold">
                {isEditing ? "Edit URL" : "Add URL"}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className="text-muted-foreground hover:text-amber-500 transition-colors"
                title={isFavorite ? "Remove favorite" : "Mark favorite"}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    isFavorite
                      ? "fill-amber-400 text-amber-500"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {/* URL Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Link Address <span className="text-destructive">*</span>
                </label>
                <InputHelpTooltip
                  content="Enter a valid web URL starting with http:// or https://. LinkStack will automatically crawl the page title, description and favicon."
                  example="https://github.com/facebook/react"
                />
              </div>
              <div className="relative">
                <Input
                  value={rawUrl}
                  onChange={(e) => {
                    setRawUrl(e.target.value);
                    if (duplicateWarning) setDuplicateWarning(null);
                  }}
                  onBlur={handleUrlBlur}
                  placeholder="Enter link address"
                  autoFocus
                  required
                  className="h-9 text-xs pr-8 font-mono"
                />
                {fetchingMeta && (
                  <div className="absolute right-2.5 top-2.5 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Duplicate Warning Alert */}
            {duplicateWarning && (
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="font-semibold">Duplicate URL Detected</span>:
                  This link is already in package{" "}
                  <strong>{duplicateWarning.packageName}</strong>
                  {duplicateWarning.sectionName
                    ? ` > ${duplicateWarning.sectionName}`
                    : ""}
                  . You can still save it if you want it organized here too.
                </div>
              </div>
            )}

            {/* Title & Favicon preview */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Title <span className="text-destructive">*</span>
                </label>
                <InputHelpTooltip
                  content="The display name of the bookmark. Automatically suggested from page metadata, or you can edit it manually."
                  example="React Official Documentation"
                />
              </div>
              <div className="flex items-center gap-2">
                {rawUrl && (
                  <div className="shrink-0 p-1.5 rounded bg-muted/60 border border-border/40">
                    <FaviconImage
                      url={rawUrl}
                      faviconUrl={faviconUrl}
                      title={title || rawUrl}
                      size={18}
                    />
                  </div>
                )}
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                  required
                  className="h-9 text-xs flex-1"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Description (Optional)
                </label>
                <InputHelpTooltip
                  content="Optional personal notes, reference documentation summary or commands related to this link."
                  example="Component lifecycle and hook reference documentation"
                />
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* Hierarchy Destination: Package & Section */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-foreground">
                    Package <span className="text-destructive">*</span>
                  </label>
                  <InputHelpTooltip
                    content="The package collection that owns this URL bookmark."
                  />
                </div>
                <select
                  value={packageId}
                  onChange={(e) => {
                    setPackageId(e.target.value);
                    setSectionId(null);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id} className="bg-popover text-popover-foreground">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-foreground">
                    Section
                  </label>
                  <InputHelpTooltip
                    content="Optional section inside the package for granular grouping. Select (Direct - No Section) to store at root package level."
                  />
                </div>
                <select
                  value={sectionId || ""}
                  onChange={(e) => setSectionId(e.target.value || null)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" className="bg-popover text-popover-foreground">
                    (Direct - No Section)
                  </option>
                  {selectedPkg?.sections.map((s) => (
                    <option key={s.id} value={s.id} className="bg-popover text-popover-foreground">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Tags (Press Enter or click Add)
                </label>
                <InputHelpTooltip
                  content="Keywords to quickly filter and group URLs across different packages. Type a tag and press Enter."
                  example="backend, react, docs"
                />
              </div>
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                {tags.map((t) => (
                  <Badge
                    key={t}
                    variant="subtle"
                    className="gap-1 pr-1 text-[11px] font-normal"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Enter tag"
                  className="h-8 text-xs flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddTag}
                  className="h-8 text-xs"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Add URL"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
