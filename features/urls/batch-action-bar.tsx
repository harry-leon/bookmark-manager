"use client";

import React, { useState } from "react";
import { FolderInput, Star, Trash2, X, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface BatchActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onMove: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  onAddTag?: (tag: string) => void;
}

export function BatchActionBar({
  selectedCount,
  onClear,
  onMove,
  onFavorite,
  onDelete,
  onAddTag,
}: BatchActionBarProps) {
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  if (selectedCount === 0) return null;

  function handleTagSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tagInput.trim()) return;
    onAddTag?.(tagInput.trim());
    setTagInput("");
    setTagDialogOpen(false);
  }

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full border border-border/80 bg-background/95 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200 max-w-[95vw]">
        <div className="flex items-center gap-1 pl-1.5 sm:pl-2 pr-1.5 sm:pr-2 border-r border-border/60">
          <span className="text-xs font-semibold text-foreground font-mono">
            {selectedCount}
          </span>
          <span className="text-xs text-muted-foreground hidden xs:inline">selected</span>
          <button
            onClick={onClear}
            title="Clear selection"
            className="ml-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onMove}
          title="Move selected"
          className="h-7 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <FolderInput className="h-3.5 w-3.5 xs:mr-1.5" />
          <span className="hidden xs:inline">Move</span>
        </Button>

        {onAddTag && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTagDialogOpen(true)}
            title="Tag selected"
            className="h-7 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <TagIcon className="h-3.5 w-3.5 xs:mr-1.5" />
            <span className="hidden xs:inline">Tag</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onFavorite}
          title="Favorite selected"
          className="h-7 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-amber-500"
        >
          <Star className="h-3.5 w-3.5 xs:mr-1.5" />
          <span className="hidden xs:inline">Favorite</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          title="Delete selected"
          className="h-7 px-2 sm:px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5 xs:mr-1.5" />
          <span className="hidden xs:inline">Delete</span>
        </Button>
      </div>

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Tag to {selectedCount} URLs</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTagSubmit} className="space-y-4 pt-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Enter tag"
              className="text-xs h-8"
              autoFocus
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setTagDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs h-7">
                Add Tag
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
