"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Folder,
  Plus,
  Star,
  Pencil,
  Trash2,
  ArrowRight,
  Search,
  MoreHorizontal,
  FolderPlus,
  ArrowUpToLine,
  Layers,
  GripVertical,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { PackageDialog } from "@/features/packages/package-dialog";
import { UrlDialog } from "@/features/urls/url-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PackageItem {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  isFavorite: boolean;
  parentId?: string | null;
  sortOrder?: number;
  createdAt: string;
  children?: Array<{ id: string; name: string }>;
  _count: {
    sections: number;
    urls: number;
    children?: number;
  };
}

function isDescendant(items: PackageItem[], ancestorId: string, targetId: string): boolean {
  if (ancestorId === targetId) return true;
  let currentId: string | null = targetId;
  const visited = new Set<string>();
  while (currentId) {
    if (currentId === ancestorId) return true;
    if (visited.has(currentId)) break;
    visited.add(currentId);
    const parent = items.find((p) => p.id === currentId)?.parentId || null;
    currentId = parent;
  }
  return false;
}

export default function PackagesListPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("order"); // 'order' | 'name' | 'created'
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);
  const [initialParentId, setInitialParentId] = useState<string | null>(null);

  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlPackageId, setUrlPackageId] = useState<string | undefined>(undefined);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPkg, setDeletingPkg] = useState<PackageItem | null>(null);

  // Drag and Drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, [sort, favoriteOnly]);

  async function loadPackages() {
    setLoading(true);
    try {
      const res = await fetch(`/api/packages?sort=${sort}&favorite=${favoriteOnly}`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite(e: React.MouseEvent, pkg: PackageItem) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !pkg.isFavorite }),
      });
      if (res.ok) {
        toast.success(pkg.isFavorite ? "Removed from favorites" : "Added to favorites");
        loadPackages();
        window.dispatchEvent(new CustomEvent("refresh-packages"));
      }
    } catch {
      toast.error("Failed to update favorite");
    }
  }

  async function handleDeletePackage() {
    if (!deletingPkg) return;
    try {
      const res = await fetch(`/api/packages/${deletingPkg.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Package deleted");
        setDeleteOpen(false);
        loadPackages();
        window.dispatchEvent(new CustomEvent("refresh-packages"));
      }
    } catch {
      toast.error("Failed to delete package");
    }
  }

  // HTML5 Drag and Drop handlers
  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    if (draggedId && draggedId !== id) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverId(id);
    }
  }

  function handleDragLeave(e: React.DragEvent, id: string) {
    if (dragOverId === id) {
      setDragOverId(null);
    }
  }

  async function handleDrop(e: React.DragEvent, targetId: string | null) {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggedId || e.dataTransfer.getData("text/plain");
    setDraggedId(null);
    setDragOverId(null);

    if (!sourceId || sourceId === targetId) return;

    if (targetId && isDescendant(packages, sourceId, targetId)) {
      toast.error("Cannot move a package into its own sub-package");
      return;
    }

    const sourcePkg = packages.find((p) => p.id === sourceId);
    const targetPkg = targetId ? packages.find((p) => p.id === targetId) : null;

    try {
      const res = await fetch("/api/packages/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: sourceId,
          targetParentId: targetId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to move package");
      }

      toast.success(
        targetPkg
          ? `Moved "${sourcePkg?.name || "Package"}" into "${targetPkg.name}"`
          : `Moved "${sourcePkg?.name || "Package"}" to Root level`
      );

      loadPackages();
      window.dispatchEvent(new CustomEvent("refresh-packages"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to move package";
      toast.error(msg);
    }
  }

  async function handleMoveToRoot(id: string) {
    try {
      const res = await fetch("/api/packages/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: id,
          targetParentId: null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to move package to root");
      }

      toast.success("Package moved to Root level");
      loadPackages();
      window.dispatchEvent(new CustomEvent("refresh-packages"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to move package";
      toast.error(msg);
    }
  }

  const filtered = packages.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col min-h-screen">
      <TopHeader
        breadcrumbs={[{ label: "Packages" }]}
        action={{
          label: "New Package",
          onClick: () => {
            setEditingPkg(null);
            setInitialParentId(null);
            setDialogOpen(true);
          },
          icon: Plus,
        }}
        onOpenCommandPalette={() =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true })
          )
        }
      />

      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full space-y-5">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-lg border border-border/50 bg-card/40">
          <div className="relative flex-1 max-w-md">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search keywords or description..."
              className="h-8 text-xs pl-8 bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="order" className="bg-popover text-popover-foreground">
                Custom Order
              </option>
              <option value="name" className="bg-popover text-popover-foreground">
                Name (A-Z)
              </option>
              <option value="created" className="bg-popover text-popover-foreground">
                Newest First
              </option>
            </select>

            <Button
              variant={favoriteOnly ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFavoriteOnly(!favoriteOnly)}
              className="h-8 text-xs gap-1.5"
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  favoriteOnly ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                )}
              />
              Favorites
            </Button>
          </div>
        </div>

        {/* Drop zone for moving package to root level if dragging */}
        {draggedId && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverId("root-card-target");
            }}
            onDragLeave={() => {
              if (dragOverId === "root-card-target") setDragOverId(null);
            }}
            onDrop={(e) => handleDrop(e, null)}
            className={cn(
              "p-3 rounded-xl border-2 border-dashed text-center text-xs font-medium transition-colors",
              dragOverId === "root-card-target"
                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/40"
                : "border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/60"
            )}
          >
            Drop here to move dragged package to Root level
          </div>
        )}

        {/* Packages Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No packages found"
            description={
              searchQuery || favoriteOnly
                ? "Try adjusting your search query or filters."
                : "Create your first package to start organizing links."
            }
            actionLabel="Create Package"
            onAction={() => {
              setEditingPkg(null);
              setInitialParentId(null);
              setDialogOpen(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((pkg) => {
              const parentPkg = pkg.parentId ? packages.find((p) => p.id === pkg.parentId) : null;
              const subCount = pkg._count?.children ?? pkg.children?.length ?? 0;
              const isBeingDragged = draggedId === pkg.id;
              const isOver = dragOverId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, pkg.id)}
                  onDragOver={(e) => handleDragOver(e, pkg.id)}
                  onDragLeave={(e) => handleDragLeave(e, pkg.id)}
                  onDrop={(e) => handleDrop(e, pkg.id)}
                  className={cn(
                    "group relative p-3 sm:p-4 rounded-xl border bg-card/50 hover:bg-card transition-all flex flex-col justify-between shadow-xs hover:shadow-md overflow-hidden cursor-grab active:cursor-grabbing",
                    isBeingDragged && "opacity-40",
                    isOver
                      ? "ring-2 ring-primary border-primary bg-primary/10 scale-[1.01]"
                      : "border-border/60 hover:border-border"
                  )}
                >
                  {/* Accent Color Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2.5px] transition-opacity opacity-75 group-hover:opacity-100"
                    style={{ backgroundColor: pkg.color || "#3b82f6" }}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <div
                          className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg shadow-xs transition-transform group-hover:scale-105 shrink-0 border border-border/40"
                          style={{ backgroundColor: `${pkg.color || "#3b82f6"}20`, color: pkg.color || "#3b82f6" }}
                        >
                          <IconRenderer name={pkg.icon} className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" style={{ color: pkg.color || "#3b82f6" }} />
                        </div>
                        {parentPkg && (
                          <span
                            className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40 truncate max-w-[100px] xs:max-w-[130px]"
                            title={`Child of ${parentPkg.name}`}
                          >
                            ↳ {parentPkg.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-1 opacity-85 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => handleToggleFavorite(e, pkg)}
                          className="p-1 sm:p-1.5 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-muted/60 transition-colors"
                          title={pkg.isFavorite ? "Remove favorite" : "Add to favorites"}
                        >
                          <Star
                            className={cn(
                              "h-3.5 w-3.5",
                              pkg.isFavorite
                                ? "fill-amber-400 text-amber-500"
                                : "text-muted-foreground/50"
                            )}
                          />
                        </button>

                        {/* 3-Dots Action Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1 sm:p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                              title="Package Options"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingPkg(null);
                                setInitialParentId(pkg.id);
                                setDialogOpen(true);
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <FolderPlus className="h-3.5 w-3.5 text-primary" />
                              <span>+ New Sub-package</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setUrlPackageId(pkg.id);
                                setUrlDialogOpen(true);
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5 text-primary" />
                              <span>+ Add URL here</span>
                            </DropdownMenuItem>
                            {pkg.parentId && (
                              <DropdownMenuItem
                                onClick={() => handleMoveToRoot(pkg.id)}
                                className="gap-2 cursor-pointer"
                              >
                                <ArrowUpToLine className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Move to Root Level</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingPkg(pkg);
                                setInitialParentId(pkg.parentId || null);
                                setDialogOpen(true);
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Edit Package</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingPkg(pkg);
                                setDeleteOpen(true);
                              }}
                              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Package</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <Link href={`/packages/${pkg.id}`} className="block">
                      <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {pkg.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5 sm:mt-1 leading-snug sm:leading-relaxed">
                        {pkg.description || "No description provided."}
                      </p>
                    </Link>
                  </div>

                  <div className="mt-2.5 pt-2 sm:mt-4 sm:pt-3 border-t border-border/40 flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1 sm:gap-1.5 font-mono flex-wrap">
                      {subCount > 0 && (
                        <span className="px-1 sm:px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold text-[9px] sm:text-[10px]">
                          {subCount} sub
                        </span>
                      )}
                      <span className="px-1 sm:px-1.5 py-0.5 rounded bg-muted/50 border border-border/30 text-[9px] sm:text-[10px]">
                        {pkg._count.sections} sec
                      </span>
                      <span className="px-1 sm:px-1.5 py-0.5 rounded bg-muted/50 border border-border/30 text-[9px] sm:text-[10px]">
                        {pkg._count.urls} links
                      </span>
                    </div>
                    <Link
                      href={`/packages/${pkg.id}`}
                      className="font-medium text-[11px] sm:text-xs text-primary hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1"
                    >
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PackageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pkg={editingPkg}
        initialParentId={initialParentId}
        onSuccess={loadPackages}
      />

      <UrlDialog
        open={urlDialogOpen}
        onOpenChange={setUrlDialogOpen}
        defaultPackageId={urlPackageId}
        onSuccess={() => {
          loadPackages();
          window.dispatchEvent(new CustomEvent("refresh-urls"));
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${deletingPkg?.name}"?`}
        description="This will permanently delete this package and all its sections and links."
        confirmLabel="Delete Package"
        onConfirm={handleDeletePackage}
      />
    </div>
  );
}
