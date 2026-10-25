"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  X,
  Plus,
  Star,
  Link2,
  Folder,
  Layers,
  Tag as TagIcon,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { UrlCard, UrlItem } from "@/features/urls/url-card";
import { UrlDialog } from "@/features/urls/url-dialog";
import { UrlMoveDialog } from "@/features/urls/url-move-dialog";
import { BatchActionBar } from "@/features/urls/batch-action-bar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PackageFilterOption {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
}

export default function AllUrlsPage() {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  // Available options
  const [packages, setPackages] = useState<PackageFilterOption[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Selection for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialogs
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [editingUrl, setEditingUrl] = useState<UrlItem | null>(null);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [movingUrlIds, setMovingUrlIds] = useState<string[]>([]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<UrlItem | null>(null);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  // When filters change, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedPackageId, selectedSectionId, selectedTag, favoriteOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUrls();
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedPackageId, selectedSectionId, selectedTag, favoriteOnly, page, pageSize]);

  async function loadFilterOptions() {
    try {
      const res = await fetch("/api/packages?sort=order");
      if (res.ok) {
        const pkgs = await res.json();
        const fullPkgs: PackageFilterOption[] = [];
        for (const p of pkgs) {
          const detailRes = await fetch(`/api/packages/${p.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            fullPkgs.push({
              id: detail.id,
              name: detail.name,
              sections: detail.sections.map((s: any) => ({
                id: s.id,
                name: s.name,
              })),
            });
          }
        }
        setPackages(fullPkgs);
      }
    } catch {
      // ignore
    }
  }

  async function loadUrls() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedPackageId) params.set("packageId", selectedPackageId);
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      if (selectedTag) params.set("tag", selectedTag);
      if (favoriteOnly) params.set("favorite", "true");
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/urls?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUrls(data.urls);
        setTotal(data.total);

        // Aggregate tags
        const tagSet = new Set<string>();
        data.urls.forEach((u: UrlItem) => {
          u.urlTags?.forEach(({ tag }) => tagSet.add(tag.name));
        });
        setAvailableTags(Array.from(tagSet));
      }
    } catch {
      toast.error("Failed to load URLs");
    } finally {
      setLoading(false);
    }
  }

  function handleClearFilters() {
    setSearchQuery("");
    setSelectedPackageId("");
    setSelectedSectionId("");
    setSelectedTag("");
    setFavoriteOnly(false);
  }

  const hasActiveFilters = Boolean(
    searchQuery || selectedPackageId || selectedSectionId || selectedTag || favoriteOnly
  );

  async function handleToggleFavorite(item: UrlItem) {
    try {
      const res = await fetch(`/api/urls/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !item.isFavorite }),
      });
      if (res.ok) {
        toast.success(item.isFavorite ? "Removed from favorites" : "Added to favorites");
        loadUrls();
      }
    } catch {
      toast.error("Failed to update favorite");
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
        setDeleteOpen(false);
        loadUrls();
      }
    } catch {
      toast.error("Failed to delete URL");
    }
  }

  // Batch actions
  function handleToggleSelect(urlId: string, selected: boolean) {
    const next = new Set(selectedIds);
    if (selected) next.add(urlId);
    else next.delete(urlId);
    setSelectedIds(next);
  }

  async function handleBatchDelete() {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch("/api/urls/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          urlIds: Array.from(selectedIds),
        }),
      });
      if (res.ok) {
        toast.success(`Deleted ${selectedIds.size} URLs`);
        setSelectedIds(new Set());
        loadUrls();
      }
    } catch {
      toast.error("Batch delete failed");
    }
  }

  async function handleBatchFavorite() {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch("/api/urls/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "favorite",
          urlIds: Array.from(selectedIds),
        }),
      });
      if (res.ok) {
        toast.success(`Marked ${selectedIds.size} URLs as favorite`);
        setSelectedIds(new Set());
        loadUrls();
      }
    } catch {
      toast.error("Batch favorite failed");
    }
  }

  async function handleBatchAddTag(tagName: string) {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch("/api/urls/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addTag",
          urlIds: Array.from(selectedIds),
          tagName,
        }),
      });
      if (res.ok) {
        toast.success(`Tagged ${selectedIds.size} URLs with #${tagName}`);
        setSelectedIds(new Set());
        loadUrls();
      } else {
        toast.error("Failed to add tags to selected URLs");
      }
    } catch {
      toast.error("Batch tag addition failed");
    }
  }

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <TopHeader
        breadcrumbs={[{ label: "All URLs" }]}
        onOpenNewUrl={() => {
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

      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full space-y-4">
        {/* Filter Bar */}
        <div className="p-2.5 rounded-xl border border-border/60 bg-card/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keywords or tags..."
              className="h-8 text-xs pl-8 bg-transparent"
            />
          </div>

          {/* Filters Group */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Package Filter */}
            <select
              value={selectedPackageId}
              onChange={(e) => {
                setSelectedPackageId(e.target.value);
                setSelectedSectionId("");
              }}
              className="h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0 max-w-[150px]"
            >
              <option value="" className="bg-popover text-popover-foreground">
                All Packages
              </option>
              {packages.map((p) => (
                <option key={p.id} value={p.id} className="bg-popover text-popover-foreground">
                  {p.name}
                </option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={!selectedPackageId}
              className="h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40 shrink-0 max-w-[140px]"
            >
              <option value="" className="bg-popover text-popover-foreground">
                All Sections
              </option>
              <option value="none" className="bg-popover text-popover-foreground">
                (Direct - No Section)
              </option>
              {selectedPkg?.sections.map((s) => (
                <option key={s.id} value={s.id} className="bg-popover text-popover-foreground">
                  {s.name}
                </option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0 max-w-[130px]"
            >
              <option value="" className="bg-popover text-popover-foreground">
                All Tags
              </option>
              {availableTags.map((t) => (
                <option key={t} value={t} className="bg-popover text-popover-foreground">
                  #{t}
                </option>
              ))}
            </select>

            {/* Favorites Toggle */}
            <Button
              variant={favoriteOnly ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFavoriteOnly(!favoriteOnly)}
              className="h-8 text-xs gap-1.5 shrink-0 px-2.5"
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  favoriteOnly ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                )}
              />
              Favorites
            </Button>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1 px-2"
                title="Reset all filters"
              >
                <X className="h-3 w-3" />
                <span className="hidden md:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* URLs List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : urls.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No URLs found"
            description={
              hasActiveFilters
                ? "No links matched the selected filters. Click 'Clear Filters' to reset."
                : "You don't have any URLs saved yet."
            }
            actionLabel={hasActiveFilters ? "Clear Filters" : "Add URL"}
            onAction={
              hasActiveFilters
                ? handleClearFilters
                : () => {
                    setEditingUrl(null);
                    setUrlDialogOpen(true);
                  }
            }
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground font-mono">
              <span>Showing {urls.length} of {total} links</span>
              <button
                onClick={() => {
                  if (selectedIds.size === urls.length) {
                    setSelectedIds(new Set());
                  } else {
                    setSelectedIds(new Set(urls.map((u) => u.id)));
                  }
                }}
                className="hover:underline text-primary"
              >
                {selectedIds.size === urls.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {urls.map((item) => (
              <UrlCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onSelectChange={(selected) => handleToggleSelect(item.id, selected)}
                onEdit={(u) => {
                  setEditingUrl(u);
                  setUrlDialogOpen(true);
                }}
                onDelete={(u) => {
                  setDeletingUrl(u);
                  setDeleteOpen(true);
                }}
                onMove={(u) => {
                  setMovingUrlIds([u.id]);
                  setMoveDialogOpen(true);
                }}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}

            {/* Pagination Controls */}
            {total > 0 && (
              <PaginationControls
                page={page}
                total={total}
                pageSize={pageSize}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onPageSizeChange={(newPageSize) => {
                  setPageSize(newPageSize);
                  setPage(1);
                }}
                className="pt-4 border-t border-border/40"
              />
            )}
          </div>
        )}
      </div>

      {/* Floating Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onMove={() => {
          setMovingUrlIds(Array.from(selectedIds));
          setMoveDialogOpen(true);
        }}
        onAddTag={handleBatchAddTag}
        onFavorite={handleBatchFavorite}
        onDelete={handleBatchDelete}
      />

      {/* URL Dialog */}
      <UrlDialog
        open={urlDialogOpen}
        onOpenChange={setUrlDialogOpen}
        urlItem={editingUrl}
        onSuccess={loadUrls}
      />

      {/* Move URLs Modal */}
      <UrlMoveDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        urlIds={movingUrlIds}
        onSuccess={() => {
          setSelectedIds(new Set());
          loadUrls();
        }}
      />

      {/* Delete Single URL Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete URL?"
        description={`Are you sure you want to delete "${deletingUrl?.title}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteUrl}
      />
    </div>
  );
}
