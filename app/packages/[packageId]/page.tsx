"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Folder,
  Plus,
  Star,
  Pencil,
  Trash2,
  Layers,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  Link2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { UrlCard, UrlItem } from "@/features/urls/url-card";
import { SectionDialog } from "@/features/sections/section-dialog";
import { PackageDialog } from "@/features/packages/package-dialog";
import { UrlDialog } from "@/features/urls/url-dialog";
import { UrlMoveDialog } from "@/features/urls/url-move-dialog";
import { BatchActionBar } from "@/features/urls/batch-action-bar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SectionWithUrls {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  urls: UrlItem[];
}

interface PackageDetail {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  isFavorite: boolean;
  sections: SectionWithUrls[];
  urls: UrlItem[]; // Direct package-level URLs
  _count: {
    sections: number;
    urls: number;
  };
}

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.packageId as string;

  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [editPackageOpen, setEditPackageOpen] = useState(false);
  const [deletePackageOpen, setDeletePackageOpen] = useState(false);

  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionWithUrls | null>(null);

  const [deleteSectionOpen, setDeleteSectionOpen] = useState(false);
  const [deletingSection, setDeletingSection] = useState<SectionWithUrls | null>(null);
  const [deleteUrlsWithSection, setDeleteUrlsWithSection] = useState(false);

  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState<UrlItem | null>(null);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [movingUrlIds, setMovingUrlIds] = useState<string[]>([]);

  const [deleteUrlOpen, setDeleteUrlOpen] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<UrlItem | null>(null);

  // Batch selection
  const [selectedUrlIds, setSelectedUrlIds] = useState<Set<string>>(new Set());

  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  useEffect(() => {
    loadPackage();
  }, [packageId]);

  async function loadPackage() {
    setLoading(true);
    try {
      const res = await fetch(`/api/packages/${packageId}`);
      if (res.ok) {
        const data = await res.json();
        setPkg(data);
      } else if (res.status === 404) {
        toast.error("Package not found");
        router.push("/");
      }
    } catch {
      toast.error("Failed to load package");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite() {
    if (!pkg) return;
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !pkg.isFavorite }),
      });
      if (res.ok) {
        toast.success(pkg.isFavorite ? "Removed from favorites" : "Added to favorites");
        loadPackage();
        window.dispatchEvent(new CustomEvent("refresh-packages"));
      }
    } catch {
      toast.error("Failed to update favorite");
    }
  }

  async function handleDeletePackage() {
    if (!pkg) return;
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Package deleted");
        window.dispatchEvent(new CustomEvent("refresh-packages"));
        router.push("/");
      }
    } catch {
      toast.error("Failed to delete package");
    }
  }

  async function handleDeleteSection() {
    if (!deletingSection) return;
    try {
      const res = await fetch(
        `/api/sections/${deletingSection.id}?deleteUrls=${deleteUrlsWithSection}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success(
          deleteUrlsWithSection
            ? "Section and enclosed URLs deleted"
            : "Section deleted, URLs moved to Package root"
        );
        loadPackage();
        setDeleteSectionOpen(false);
      }
    } catch {
      toast.error("Failed to delete section");
    }
  }

  async function handleReorderSection(sectionId: string, direction: "up" | "down") {
    if (!pkg) return;
    const currentSections = [...pkg.sections];
    const index = currentSections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSections.length) return;

    // Swap
    const temp = currentSections[index];
    currentSections[index] = currentSections[targetIndex];
    currentSections[targetIndex] = temp;

    // Optimistic update
    setPkg({ ...pkg, sections: currentSections });

    try {
      await fetch("/api/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          sectionIds: currentSections.map((s) => s.id),
        }),
      });
      toast.success("Section reordered");
    } catch {
      toast.error("Failed to save order");
      loadPackage();
    }
  }

  async function handleDeleteUrl() {
    if (!deletingUrl) return;
    try {
      const res = await fetch(`/api/urls/${deletingUrl.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("URL deleted");
        loadPackage();
        setDeleteUrlOpen(false);
      }
    } catch {
      toast.error("Failed to delete URL");
    }
  }

  async function handleToggleUrlFavorite(item: UrlItem) {
    try {
      const res = await fetch(`/api/urls/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !item.isFavorite }),
      });
      if (res.ok) {
        toast.success(item.isFavorite ? "Removed from favorites" : "Added to favorites");
        loadPackage();
      }
    } catch {
      toast.error("Failed to update favorite");
    }
  }

  // Batch actions
  function handleSelectAll(urls: UrlItem[]) {
    const next = new Set(selectedUrlIds);
    urls.forEach((u) => next.add(u.id));
    setSelectedUrlIds(next);
  }

  function handleToggleSelect(urlId: string, selected: boolean) {
    const next = new Set(selectedUrlIds);
    if (selected) next.add(urlId);
    else next.delete(urlId);
    setSelectedUrlIds(next);
  }

  async function handleBatchDelete() {
    if (selectedUrlIds.size === 0) return;
    try {
      const res = await fetch("/api/urls/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          urlIds: Array.from(selectedUrlIds),
        }),
      });
      if (res.ok) {
        toast.success(`Deleted ${selectedUrlIds.size} URLs`);
        setSelectedUrlIds(new Set());
        loadPackage();
      }
    } catch {
      toast.error("Batch delete failed");
    }
  }

  async function handleBatchFavorite() {
    if (selectedUrlIds.size === 0) return;
    try {
      const res = await fetch("/api/urls/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "favorite",
          urlIds: Array.from(selectedUrlIds),
        }),
      });
      if (res.ok) {
        toast.success(`Marked ${selectedUrlIds.size} URLs as favorite`);
        setSelectedUrlIds(new Set());
        loadPackage();
      }
    } catch {
      toast.error("Batch favorite failed");
    }
  }

  async function handleBatchAddTag(tagName: string) {
    if (selectedUrlIds.size === 0) return;
    try {
      const res = await fetch("/api/urls/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addTag",
          urlIds: Array.from(selectedUrlIds),
          tagName,
        }),
      });
      if (res.ok) {
        toast.success(`Tagged ${selectedUrlIds.size} URLs with #${tagName}`);
        setSelectedUrlIds(new Set());
        loadPackage();
      } else {
        toast.error("Failed to add tags to selected URLs");
      }
    } catch {
      toast.error("Batch tag addition failed");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopHeader breadcrumbs={[{ label: "Packages", href: "/packages" }, { label: "Loading..." }]} />
        <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!pkg) return null;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <TopHeader
        breadcrumbs={[
          { label: "Packages", href: "/packages" },
          { label: pkg.name },
        ]}
        onOpenNewUrl={() => {
          setTargetSectionId(null);
          setEditingUrl(null);
          setUrlDialogOpen(true);
        }}
        onOpenNewPackage={() => window.dispatchEvent(new CustomEvent("open-new-package"))}
        onOpenCommandPalette={() =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true })
          )
        }
      />

      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full space-y-6">
        {/* Package Header Card */}
        <div className="relative overflow-hidden p-5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Top Accent Line */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: pkg.color || "#3b82f6" }}
          />

          <div className="flex items-start gap-3.5">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shadow-xs shrink-0 border border-border/40"
              style={{ backgroundColor: `${pkg.color || "#3b82f6"}20`, color: pkg.color || "#3b82f6" }}
            >
              <IconRenderer name={pkg.icon} className="h-5 w-5" style={{ color: pkg.color || "#3b82f6" }} />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {pkg.name}
                </h1>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className="text-muted-foreground hover:text-amber-500 transition-colors"
                  title={pkg.isFavorite ? "Remove favorite" : "Add to favorites"}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      pkg.isFavorite ? "fill-amber-400 text-amber-500" : "text-muted-foreground/60"
                    )}
                  />
                </button>
              </div>

              {pkg.description && (
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
                  {pkg.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground font-mono">
                <span>{pkg.sections.length} sections</span>
                <span>•</span>
                <span>
                  {pkg.urls.length +
                    pkg.sections.reduce((acc, s) => acc + s.urls.length, 0)}{" "}
                  total URLs
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingSection(null);
                setSectionDialogOpen(true);
              }}
              className="h-8 text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Section
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditPackageOpen(true)}
              title="Edit Package"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeletePackageOpen(true)}
              title="Delete Package"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Sections Listing */}
        <div className="space-y-6">
          {pkg.sections.map((section, idx) => (
            <div
              key={section.id}
              className="rounded-xl border border-border/60 bg-card/30 overflow-hidden shadow-xs"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/40">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse(section.id)}
                    className="p-1 -ml-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                    title={collapsedSections[section.id] ? "Expand section" : "Collapse section"}
                  >
                    {collapsedSections[section.id] ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-foreground shrink-0">
                    <IconRenderer name={section.icon || "FolderOpen"} className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h2
                        onClick={() => toggleSectionCollapse(section.id)}
                        className="text-xs font-bold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      >
                        {section.name}
                      </h2>
                      <span className="text-[10px] text-muted-foreground font-mono px-1 rounded bg-muted/50">
                        {section.urls.length}
                      </span>
                    </div>
                    {section.description && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section Action Controls */}
                <div className="flex items-center gap-1">
                  {/* Reorder Buttons */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={idx === 0}
                    onClick={() => handleReorderSection(section.id, "up")}
                    title="Move section up"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={idx === pkg.sections.length - 1}
                    onClick={() => handleReorderSection(section.id, "down")}
                    title="Move section down"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>

                  <div className="h-3.5 w-px bg-border/60 mx-1" />

                  {/* Add URL to this Section */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTargetSectionId(section.id);
                      setEditingUrl(null);
                      setUrlDialogOpen(true);
                    }}
                    className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                    URL
                  </Button>

                  {/* Edit Section */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditingSection(section);
                      setSectionDialogOpen(true);
                    }}
                    title="Edit Section"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>

                  {/* Delete Section */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setDeletingSection(section);
                      setDeleteUrlsWithSection(false);
                      setDeleteSectionOpen(true);
                    }}
                    title="Delete Section"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Section URLs List */}
              {!collapsedSections[section.id] && (
                <div className="p-3">
                  {section.urls.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-muted-foreground">No links in this section yet.</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setTargetSectionId(section.id);
                          setEditingUrl(null);
                          setUrlDialogOpen(true);
                        }}
                        className="text-xs h-auto p-0 mt-1 text-primary"
                      >
                        + Add a URL here
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {section.urls.map((item) => (
                        <UrlCard
                          key={item.id}
                          item={item}
                          isSelected={selectedUrlIds.has(item.id)}
                          onSelectChange={(selected) => handleToggleSelect(item.id, selected)}
                          onEdit={(u) => {
                            setEditingUrl(u);
                            setUrlDialogOpen(true);
                          }}
                          onDelete={(u) => {
                            setDeletingUrl(u);
                            setDeleteUrlOpen(true);
                          }}
                          onMove={(u) => {
                            setMovingUrlIds([u.id]);
                            setMoveDialogOpen(true);
                          }}
                          onToggleFavorite={handleToggleUrlFavorite}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Direct Package URLs (Section-less URLs) */}
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-xs font-semibold text-foreground">
                  Direct Package URLs (No Section)
                </h2>
                <span className="text-[10px] text-muted-foreground font-mono px-1 rounded bg-muted/50">
                  {pkg.urls.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTargetSectionId(null);
                  setEditingUrl(null);
                  setUrlDialogOpen(true);
                }}
                className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Add Direct URL
              </Button>
            </div>

            <div className="p-3">
              {pkg.urls.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No direct URLs saved in this package.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {pkg.urls.map((item) => (
                    <UrlCard
                      key={item.id}
                      item={item}
                      isSelected={selectedUrlIds.has(item.id)}
                      onSelectChange={(selected) => handleToggleSelect(item.id, selected)}
                      onEdit={(u) => {
                        setEditingUrl(u);
                        setUrlDialogOpen(true);
                      }}
                      onDelete={(u) => {
                        setDeletingUrl(u);
                        setDeleteUrlOpen(true);
                      }}
                      onMove={(u) => {
                        setMovingUrlIds([u.id]);
                        setMoveDialogOpen(true);
                      }}
                      onToggleFavorite={handleToggleUrlFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedUrlIds.size}
        onClear={() => setSelectedUrlIds(new Set())}
        onMove={() => {
          setMovingUrlIds(Array.from(selectedUrlIds));
          setMoveDialogOpen(true);
        }}
        onAddTag={handleBatchAddTag}
        onFavorite={handleBatchFavorite}
        onDelete={handleBatchDelete}
      />

      {/* Edit Package Modal */}
      <PackageDialog
        open={editPackageOpen}
        onOpenChange={setEditPackageOpen}
        pkg={pkg}
        onSuccess={loadPackage}
      />

      {/* Delete Package Confirmation */}
      <ConfirmDialog
        open={deletePackageOpen}
        onOpenChange={setDeletePackageOpen}
        title={`Delete "${pkg.name}"?`}
        description="This will permanently delete this Package and all its Sections and URLs. This action cannot be undone."
        confirmLabel="Delete Package"
        onConfirm={handleDeletePackage}
      />

      {/* Section Dialog (Create / Edit) */}
      <SectionDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        packageId={pkg.id}
        section={editingSection}
        onSuccess={loadPackage}
      />

      {/* Delete Section Confirmation with URL Handling */}
      <ConfirmDialog
        open={deleteSectionOpen}
        onOpenChange={setDeleteSectionOpen}
        title={`Delete Section "${deletingSection?.name}"?`}
        description="Choose what to do with the URLs contained inside this section:"
        confirmLabel={deleteUrlsWithSection ? "Delete Section & URLs" : "Delete Section Only"}
        onConfirm={handleDeleteSection}
        extraAction={
          <div className="space-y-2 pt-1 pb-1">
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
              <input
                type="radio"
                name="urlAction"
                checked={!deleteUrlsWithSection}
                onChange={() => setDeleteUrlsWithSection(false)}
                className="accent-primary"
              />
              <span>
                <strong>Preserve URLs</strong>: Move URLs to Package root (Direct URLs)
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
              <input
                type="radio"
                name="urlAction"
                checked={deleteUrlsWithSection}
                onChange={() => setDeleteUrlsWithSection(true)}
                className="accent-destructive"
              />
              <span className="text-destructive font-medium">
                <strong>Delete all URLs</strong> inside this section
              </span>
            </label>
          </div>
        }
      />

      {/* URL Dialog (Create / Edit) */}
      <UrlDialog
        open={urlDialogOpen}
        onOpenChange={setUrlDialogOpen}
        defaultPackageId={pkg.id}
        defaultSectionId={targetSectionId}
        urlItem={editingUrl}
        onSuccess={loadPackage}
      />

      {/* Move URLs Modal */}
      <UrlMoveDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        urlIds={movingUrlIds}
        currentPackageId={pkg.id}
        onSuccess={() => {
          setSelectedUrlIds(new Set());
          loadPackage();
        }}
      />

      {/* Delete Single URL Confirmation */}
      <ConfirmDialog
        open={deleteUrlOpen}
        onOpenChange={setDeleteUrlOpen}
        title="Delete URL?"
        description={`Are you sure you want to delete "${deletingUrl?.title}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteUrl}
      />
    </div>
  );
}
