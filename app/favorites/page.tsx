"use client";

import React, { useEffect, useState } from "react";
import { Star, Link2 } from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { UrlCard, UrlItem } from "@/features/urls/url-card";
import { UrlDialog } from "@/features/urls/url-dialog";
import { UrlMoveDialog } from "@/features/urls/url-move-dialog";
import { BatchActionBar } from "@/features/urls/batch-action-bar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function FavoritesPage() {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialogs
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [editingUrl, setEditingUrl] = useState<UrlItem | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [movingUrlIds, setMovingUrlIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<UrlItem | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    setLoading(true);
    try {
      const res = await fetch("/api/urls?favorite=true&limit=100");
      if (res.ok) {
        const data = await res.json();
        setUrls(data.urls);
      }
    } catch {
      toast.error("Failed to load favorite links");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite(item: UrlItem) {
    try {
      const res = await fetch(`/api/urls/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !item.isFavorite }),
      });
      if (res.ok) {
        toast.success(item.isFavorite ? "Removed from favorites" : "Added to favorites");
        loadFavorites();
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
        loadFavorites();
      }
    } catch {
      toast.error("Failed to delete URL");
    }
  }

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
        loadFavorites();
      }
    } catch {
      toast.error("Batch delete failed");
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
        loadFavorites();
      } else {
        toast.error("Failed to add tags to selected URLs");
      }
    } catch {
      toast.error("Batch tag addition failed");
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <TopHeader
        breadcrumbs={[{ label: "Favorites" }]}
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

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : urls.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No favorite links yet"
            description="Star important links anywhere in the app to access them quickly from here."
          />
        ) : (
          <div className="space-y-2">
            <div className="px-1 text-[11px] text-muted-foreground font-mono">
              {urls.length} favorite {urls.length === 1 ? "link" : "links"}
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
          </div>
        )}
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onMove={() => {
          setMovingUrlIds(Array.from(selectedIds));
          setMoveDialogOpen(true);
        }}
        onAddTag={handleBatchAddTag}
        onFavorite={() => {}}
        onDelete={handleBatchDelete}
      />

      <UrlDialog
        open={urlDialogOpen}
        onOpenChange={setUrlDialogOpen}
        urlItem={editingUrl}
        onSuccess={loadFavorites}
      />

      <UrlMoveDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        urlIds={movingUrlIds}
        onSuccess={() => {
          setSelectedIds(new Set());
          loadFavorites();
        }}
      />

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
