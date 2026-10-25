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
import { Pipette, Search } from "lucide-react";

interface PackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg?: {
    id: string;
    name: string;
    description?: string | null;
    color: string;
    icon: string;
    isFavorite: boolean;
    parentId?: string | null;
  } | null;
  initialParentId?: string | null;
  onSuccess?: () => void;
}

function toHexForInput(c: string): string {
  if (!c) return "#3b82f6";
  if (/^#[0-9A-Fa-f]{6}$/.test(c)) return c;
  if (/^#[0-9A-Fa-f]{3}$/.test(c)) {
    return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  }
  return "#3b82f6";
}

const COLOR_PRESETS = [
  "#3b82f6", // Blue
  "#2563eb", // Royal Blue
  "#0ea5e9", // Sky
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#10b981", // Emerald
  "#22c55e", // Green
  "#84cc16", // Lime
  "#eab308", // Yellow
  "#f59e0b", // Amber
  "#f97316", // Orange
  "#ef4444", // Red
  "#f43f5e", // Rose
  "#ec4899", // Pink
  "#d946ef", // Fuchsia
  "#a855f7", // Purple
  "#8b5cf6", // Violet
  "#6366f1", // Indigo
  "#64748b", // Slate
  "#71717a", // Zinc
  "#78716c", // Stone
  "#475569", // Dark Slate
  "#0f172a", // Navy
  "#18181b", // Dark Zinc
];

const ICON_PRESETS = [
  // Folders & Structure
  "Folder", "FolderGit2", "FolderArchive", "FolderOpen", "FolderPlus", "Box", "Boxes", "Layers", "Archive", "Bookmark", "Tag", "Tags", "Library", "Network",
  // Code & Architecture
  "Code2", "Terminal", "Cpu", "Database", "Server", "Cloud", "Globe", "GitBranch", "GitPullRequest", "GitMerge", "GitCommit", "Workflow", "Bug", "FileCode", "Binary", "Brackets", "Webhook", "HardDrive", "Laptop", "Monitor", "Smartphone", "Tablet",
  // Security & Identity
  "Shield", "ShieldCheck", "Key", "Lock", "Unlock", "Fingerprint", "Eye", "Zap", "Sparkles", "Rocket", "Flame", "Radio", "Wifi", "Bluetooth", "QrCode",
  // Media & Design
  "Palette", "Paintbrush", "Compass", "Image", "Camera", "Video", "Music", "Headphones", "Mic", "Film", "Play", "Figma", "Crop", "Wand2",
  // Tools & Productivity
  "Wrench", "Hammer", "Settings", "Sliders", "Scissors", "Paperclip", "Pin", "Clock", "Calendar", "CheckCircle2", "CheckSquare", "ListTodo", "Clipboard", "FileText", "StickyNote", "BookOpen", "GraduationCap", "Search",
  // Communication & People
  "MessageSquare", "MessagesSquare", "Mail", "Send", "Share2", "Bell", "AtSign", "Hash", "Link", "ExternalLink", "Bot", "Users", "User", "Heart", "ThumbsUp", "Star",
  // Business & Commerce
  "Briefcase", "ShoppingBag", "ShoppingCart", "CreditCard", "DollarSign", "Wallet", "TrendingUp", "BarChart2", "PieChart", "Activity", "Target", "Award", "Trophy", "Crown", "Gift",
  // Lifestyle & Space
  "Coffee", "CupSoda", "Utensils", "Plane", "Car", "MapPin", "Navigation", "Sun", "Moon", "Sparkle", "Lightbulb", "Atom", "LifeBuoy"
];

export function PackageDialog({
  open,
  onOpenChange,
  pkg,
  initialParentId = null,
  onSuccess,
}: PackageDialogProps) {
  const isEditing = Boolean(pkg);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState("Folder");
  const [iconSearch, setIconSearch] = useState("");
  const [parentId, setParentId] = useState<string | null>(initialParentId);
  const [isFavorite, setIsFavorite] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // Load potential parent packages
      fetch("/api/packages?sort=name")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: any[]) => {
          // If editing, filter out self to prevent circular parent
          const filtered = pkg ? data.filter((p) => p.id !== pkg.id) : data;
          setAvailablePackages(filtered);
        })
        .catch(() => {});
    }
  }, [open, pkg]);

  useEffect(() => {
    if (pkg) {
      setName(pkg.name);
      setDescription(pkg.description || "");
      setColor(pkg.color || "#3b82f6");
      setIcon(pkg.icon || "Folder");
      setIsFavorite(pkg.isFavorite || false);
      setParentId(pkg.parentId ?? null);
    } else {
      setName("");
      setDescription("");
      setColor("#3b82f6");
      setIcon("Folder");
      setIsFavorite(false);
      setParentId(initialParentId ?? null);
    }
  }, [pkg, initialParentId, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Package name is required");
      return;
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/packages/${pkg?.id}` : "/api/packages";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          color,
          icon,
          isFavorite,
          parentId: parentId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save package");
      }

      toast.success(isEditing ? "Package updated" : "Package created");
      window.dispatchEvent(new CustomEvent("refresh-packages"));
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const filteredIcons = ICON_PRESETS.filter((ic) =>
    ic.toLowerCase().includes(iconSearch.toLowerCase().trim())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {isEditing ? "Edit Package" : "Create New Package"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {/* Live Visual Preview */}
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-muted/20">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg shadow-xs shrink-0 transition-all border border-border/40"
                style={{ backgroundColor: `${color}20`, color }}
              >
                <IconRenderer name={icon} className="h-5 w-5" style={{ color }} />
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-xs font-bold text-foreground truncate">
                  {name || "Untitled Package"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {description || "Live badge preview"}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Name <span className="text-destructive">*</span>
                </label>
                <InputHelpTooltip
                  content="The title of this package collection."
                  example="Java Backend, DevOps, Design Systems"
                />
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter package name"
                autoFocus
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Parent Package for nesting */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Parent Package (Optional)
                </label>
                <InputHelpTooltip
                  content="Select a parent package to nest this package as a sub-package. Leave as Root Package for top level."
                  example="Nest 'Microservices' inside 'Java Backend'"
                />
              </div>
              <select
                value={parentId || ""}
                onChange={(e) => setParentId(e.target.value || null)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">(None - Root Package)</option>
                {availablePackages.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Description (Optional)
                </label>
                <InputHelpTooltip
                  content="A brief summary describing the purpose or contents of this package."
                  example="Official documentation and GitHub repositories for Spring Boot"
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

            {/* Color Selection (RGB / RGBA / Hex + Native Picker + 24 Swatches) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground">
                  Accent Color (RGB / Hex)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="color"
                      value={toHexForInput(color)}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Choose custom color"
                    />
                    <div
                      className="h-6 w-6 rounded-md border border-border/80 flex items-center justify-center cursor-pointer shadow-xs transition-transform hover:scale-105"
                      style={{ backgroundColor: color }}
                    >
                      <Pipette className="h-3 w-3 text-white drop-shadow-xs" />
                    </div>
                  </div>
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3b82f6 or rgb(59, 130, 246)"
                    className="h-7 w-40 text-xs font-mono px-2 bg-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-1.5 pt-0.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-5 w-5 rounded-full transition-transform mx-auto",
                      color.toLowerCase() === c.toLowerCase()
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                        : "opacity-80 hover:opacity-100 hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Icon Selection (Searchable 120+ Lucide icons) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Icon
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({filteredIcons.length})
                  </span>
                </div>
                <div className="relative w-36">
                  <Search className="h-3 w-3 text-muted-foreground absolute left-2 top-2" />
                  <Input
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Search icons…"
                    className="h-7 text-xs pl-7 pr-2 bg-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 p-2 rounded-md border border-border/60 bg-muted/20 max-h-44 overflow-y-auto scrollbar-thin">
                {filteredIcons.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-xs text-muted-foreground">
                    No icons matching &ldquo;{iconSearch}&rdquo;
                  </div>
                ) : (
                  filteredIcons.map((ic) => {
                    const isSelected = icon === ic;
                    return (
                      <button
                        key={ic}
                        type="button"
                        title={ic}
                        onClick={() => setIcon(ic)}
                        className={cn(
                          "h-8 w-8 rounded flex items-center justify-center transition-all",
                          isSelected
                            ? "ring-2 ring-foreground scale-105 shadow-xs"
                            : "hover:bg-muted/80 opacity-75 hover:opacity-100"
                        )}
                        style={{
                          backgroundColor: isSelected ? `${color}25` : undefined,
                        }}
                      >
                        <IconRenderer
                          name={ic}
                          className="h-4 w-4 transition-colors"
                          style={{ color: isSelected ? color : undefined }}
                        />
                      </button>
                    );
                  })
                )}
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
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
