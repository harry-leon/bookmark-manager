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
import { toast } from "sonner";

interface PackageOption {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
}

interface UrlMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urlIds: string[];
  currentPackageId?: string;
  onSuccess?: () => void;
}

export function UrlMoveDialog({
  open,
  onOpenChange,
  urlIds,
  currentPackageId,
  onSuccess,
}: UrlMoveDialogProps) {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (open) {
      loadPackages();
    }
  }, [open]);

  async function loadPackages() {
    try {
      const res = await fetch("/api/packages?sort=order");
      if (res.ok) {
        const pkgs = await res.json();
        const fullPkgs: PackageOption[] = [];
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
        if (fullPkgs.length > 0) {
          setSelectedPackageId(currentPackageId || fullPkgs[0].id);
        }
      }
    } catch {
      // ignore
    }
  }

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);

  async function handleMove() {
    if (!selectedPackageId) {
      toast.error("Please select a target package");
      return;
    }

    setMoving(true);
    try {
      const res = await fetch("/api/urls/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          urlIds,
          targetPackageId: selectedPackageId,
          targetSectionId: selectedSectionId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to move URLs");
      }

      toast.success(`Moved ${urlIds.length} link${urlIds.length > 1 ? "s" : ""}`);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to move";
      toast.error(msg);
    } finally {
      setMoving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Move {urlIds.length > 1 ? `${urlIds.length} URLs` : "URL"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Destination Package
            </label>
            <select
              value={selectedPackageId}
              onChange={(e) => {
                setSelectedPackageId(e.target.value);
                setSelectedSectionId(null);
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
            <label className="text-xs font-medium text-foreground block mb-1">
              Destination Section
            </label>
            <select
              value={selectedSectionId || ""}
              onChange={(e) => setSelectedSectionId(e.target.value || null)}
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

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={moving}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleMove} disabled={moving}>
            {moving ? "Moving..." : "Move Here"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
