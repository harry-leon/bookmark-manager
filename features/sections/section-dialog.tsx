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
import { IconRenderer } from "@/components/shared/icon-renderer";
import { InputHelpTooltip } from "@/components/shared/input-help-tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  section?: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
  } | null;
  onSuccess?: () => void;
}

const SECTION_ICONS = [
  "FolderOpen",
  "Cpu",
  "Shield",
  "Database",
  "Palette",
  "Code",
  "Terminal",
  "Box",
  "Zap",
  "CheckCircle",
  "Globe",
  "Bookmark",
  "Server",
  "Key",
];

export function SectionDialog({
  open,
  onOpenChange,
  packageId,
  section,
  onSuccess,
}: SectionDialogProps) {
  const isEditing = Boolean(section);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("FolderOpen");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (section) {
      setName(section.name);
      setDescription(section.description || "");
      setIcon(section.icon || "FolderOpen");
    } else {
      setName("");
      setDescription("");
      setIcon("FolderOpen");
    }
  }, [section, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Section name is required");
      return;
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/sections/${section?.id}` : "/api/sections";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          name: name.trim(),
          description: description.trim() || null,
          icon,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save section");
      }

      toast.success(isEditing ? "Section updated" : "Section created");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {isEditing ? "Edit Section" : "Create New Section"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-xs font-medium text-foreground">
                  Section Name <span className="text-destructive">*</span>
                </label>
                <InputHelpTooltip
                  content="Categorizes links within this package by topic or architecture layer."
                  example="e.g. Frontend UI, Authentication, Database & ORM, CI/CD"
                />
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter section name"
                autoFocus
                required
                className="h-9 text-xs"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-xs font-medium text-foreground">
                  Description (Optional)
                </label>
                <InputHelpTooltip
                  content="Brief summary explaining what links or documentation live in this section."
                  example="e.g. Links to PostgreSQL schemas, query builders, and migration scripts"
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

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Icon
              </label>
              <div className="grid grid-cols-7 gap-1.5 p-2 rounded-md border border-border/60 bg-muted/20">
                {SECTION_ICONS.map((ic) => {
                  const isSelected = icon === ic;
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={cn(
                        "h-8 w-8 rounded flex items-center justify-center transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <IconRenderer name={ic} className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
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
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
