"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Folder,
  Layers,
  Link2,
  Tag,
  ExternalLink,
  Plus,
  FileDown,
  Sun,
  Moon,
  ArrowRight,
  FileText,
  CheckSquare,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FaviconImage } from "@/components/shared/favicon-image";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenNewPackage?: () => void;
  onOpenNewUrl?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenNewPackage,
  onOpenNewUrl,
}: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    packages: any[];
    sections: any[];
    urls: any[];
    tags: any[];
    notes?: any[];
    tasks?: any[];
  }>({
    packages: [],
    sections: [],
    urls: [],
    tags: [],
    notes: [],
    tasks: [],
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      search("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  async function search(q: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setSelectedIndex(0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // Flatten items for keyboard navigation
  const flatItems: Array<{
    type: "action" | "package" | "section" | "url" | "tag" | "note" | "task";
    id: string;
    label: string;
    subLabel?: string;
    icon?: any;
    data?: any;
    action: () => void;
  }> = [];


  // Default quick actions when query is short or matches
  if (!query || "new add url create".includes(query.toLowerCase())) {
    flatItems.push({
      type: "action",
      id: "action-add-url",
      label: "Add new URL",
      subLabel: "Create and organize a new link",
      icon: Plus,
      action: () => {
        onOpenChange(false);
        onOpenNewUrl?.();
      },
    });
  }

  if (!query || "package create new".includes(query.toLowerCase())) {
    flatItems.push({
      type: "action",
      id: "action-add-pkg",
      label: "Create new Package",
      subLabel: "Create a container for sections and links",
      icon: Folder,
      action: () => {
        onOpenChange(false);
        onOpenNewPackage?.();
      },
    });
  }

  if (!query || "import export bookmark".includes(query.toLowerCase())) {
    flatItems.push({
      type: "action",
      id: "action-import",
      label: "Import & Export Bookmarks",
      subLabel: "Browser HTML and JSON data sync",
      icon: FileDown,
      action: () => {
        onOpenChange(false);
        router.push("/import-export");
      },
    });
  }

  // Packages
  results.packages.forEach((pkg) => {
    flatItems.push({
      type: "package",
      id: `pkg-${pkg.id}`,
      label: pkg.name,
      subLabel: pkg.description || "Package",
      data: pkg,
      action: () => {
        onOpenChange(false);
        router.push(`/packages/${pkg.id}`);
      },
    });
  });

  // Sections
  results.sections.forEach((sec) => {
    flatItems.push({
      type: "section",
      id: `sec-${sec.id}`,
      label: sec.name,
      subLabel: `in ${sec.package.name}`,
      data: sec,
      action: () => {
        onOpenChange(false);
        router.push(`/packages/${sec.package.id}`);
      },
    });
  });

  // URLs
  results.urls.forEach((u) => {
    flatItems.push({
      type: "url",
      id: `url-${u.id}`,
      label: u.title,
      subLabel: `${u.package?.name || ""}${u.section ? ` > ${u.section.name}` : ""} · ${u.url}`,
      data: u,
      action: () => {
        window.open(u.url, "_blank", "noopener,noreferrer");
        onOpenChange(false);
      },
    });
  });

  // Notes
  (results.notes || []).forEach((n) => {
    flatItems.push({
      type: "note",
      id: `note-${n.id}`,
      label: n.title || "Untitled Note",
      subLabel: n.url?.title ? `Note on: ${n.url.title}` : (n.content ? n.content.slice(0, 60) : "Note"),
      data: n,
      action: () => {
        onOpenChange(false);
        router.push(`/notes/${n.id}`);
      },
    });
  });

  // Tasks
  (results.tasks || []).forEach((t) => {
    flatItems.push({
      type: "task",
      id: `task-${t.id}`,
      label: t.title,
      subLabel: `Task [${t.status}] · Priority: ${t.priority}`,
      data: t,
      action: () => {
        onOpenChange(false);
        router.push("/tasks");
      },
    });
  });


  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl overflow-hidden border-border/80 shadow-2xl gap-0 top-[30%]">
        {/* Search Input Bar */}
        <div className="flex items-center px-3.5 border-b border-border/60">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2.5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter search keywords or command..."
            className="w-full bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none focus:ring-0"
          />
          {loading && (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto p-1.5 scrollbar-thin">
          {flatItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-0.5">
              {flatItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-colors",
                      isSelected
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.type === "action" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-muted-foreground shrink-0">
                          {React.createElement(item.icon || Plus, { className: "h-3.5 w-3.5" })}
                        </div>
                      )}

                      {item.type === "package" && (
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.data?.color || "#3b82f6" }}
                        />
                      )}

                      {item.type === "section" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-muted/70 text-muted-foreground shrink-0">
                          <Layers className="h-3.5 w-3.5" />
                        </div>
                      )}

                      {item.type === "url" && (
                        <FaviconImage
                          url={item.data?.url}
                          faviconUrl={item.data?.faviconUrl}
                          title={item.label}
                          size={16}
                          className="h-4 w-4 rounded-xs shrink-0"
                        />
                      )}

                      {item.type === "note" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-amber-500 shrink-0">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                      )}

                      {item.type === "task" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/10 text-blue-500 shrink-0">
                          <CheckSquare className="h-3.5 w-3.5" />
                        </div>
                      )}


                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="truncate text-foreground font-medium">{item.label}</span>
                        {item.subLabel && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {item.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {item.type === "url" ? (
                        <ExternalLink className="h-3 w-3 text-muted-foreground/60" />
                      ) : (
                        <span className="text-[10px] uppercase font-mono text-muted-foreground/60 px-1 py-0.5 rounded bg-muted/40">
                          {item.type}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-muted/20 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-muted px-1 rounded">↑</kbd>{" "}
              <kbd className="font-mono bg-muted px-1 rounded">↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono bg-muted px-1 rounded">↵</kbd> select
            </span>
            <span>
              <kbd className="font-mono bg-muted px-1 rounded">esc</kbd> close
            </span>
          </div>
          <span className="text-muted-foreground/60 font-mono">LinkStack Command</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
