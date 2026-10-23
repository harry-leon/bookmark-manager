"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Copy,
  Check,
  Star,
  MoreVertical,
  Pencil,
  Trash2,
  FolderInput,
  FileText,
  Activity,
  MousePointerClick,
  NotebookPen,
} from "lucide-react";

import { FaviconImage } from "@/components/shared/favicon-image";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getDomain } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface UrlItem {
  id: string;
  url: string;
  title: string;
  description?: string | null;
  faviconUrl?: string | null;
  isFavorite: boolean;
  clickCount?: number;
  lastVisitedAt?: string | Date | null;
  packageId: string;
  sectionId?: string | null;
  package?: { id: string; name: string; color: string; icon: string };
  section?: { id: string; name: string };
  urlTags?: Array<{ tag: { name: string } }>;
  createdAt?: string | Date;
}

interface UrlCardProps {
  item: UrlItem;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onEdit?: (item: UrlItem) => void;
  onDelete?: (item: UrlItem) => void;
  onMove?: (item: UrlItem) => void;
  onToggleFavorite?: (item: UrlItem) => void;
}

function UrlCardComponent({
  item,
  isSelected = false,
  onSelectChange,
  onEdit,
  onDelete,
  onMove,
  onToggleFavorite,
}: UrlCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(item.isFavorite);
  const [clickCount, setClickCount] = useState(item.clickCount || 0);

  const [healthStatus, setHealthStatus] = useState<"idle" | "checking" | "alive" | "dead">("idle");
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  useEffect(() => {
    setIsFavorite(item.isFavorite);
  }, [item.isFavorite]);

  useEffect(() => {
    if (typeof item.clickCount === "number") {
      setClickCount(item.clickCount);
    }
  }, [item.clickCount]);

  const domain = getDomain(item.url);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function handleCopyMarkdown(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const markdown = `[${item.title}](${item.url})`;
      await navigator.clipboard.writeText(markdown);
      toast.success("Copied as Markdown [Title](url)");
    } catch {
      toast.error("Failed to copy Markdown");
    }
  }

  function handleOpen(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest('[role="menuitem"]')
    ) {
      return;
    }

    // Fire-and-forget click tracking
    fetch(`/api/urls/${item.id}/click`, { method: "POST" })
      .then((res) => {
        if (res.ok) setClickCount((c) => c + 1);
      })
      .catch(() => {});

    window.open(item.url, "_blank", "noopener,noreferrer");
  }

  async function handleOptimisticToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      onToggleFavorite?.({ ...item, isFavorite: next });
    } catch {
      setIsFavorite(!next);
    }
  }

  async function handleCheckHealth(e: React.MouseEvent) {
    e.stopPropagation();
    setHealthStatus("checking");
    try {
      const res = await fetch(`/api/urls/${item.id}/ping`);
      const data = await res.json();
      if (data.isAlive) {
        setHealthStatus("alive");
        setPingLatency(data.responseTimeMs);
        toast.success(`URL reachable: Status ${data.status} (${data.responseTimeMs}ms)`);
      } else {
        setHealthStatus("dead");
        toast.error(`URL unreachable: ${data.reason || "Status " + data.status}`);
      }
    } catch {
      setHealthStatus("dead");
      toast.error("URL health check request failed");
    }
  }

  return (
    <div
      onClick={handleOpen}
      className={cn(
        "group relative flex items-center justify-between gap-2 sm:gap-3 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-lg border transition-all cursor-pointer",
        isSelected
          ? "border-primary/60 bg-primary/5 shadow-xs"
          : "border-border/50 bg-card/40 hover:bg-card hover:border-border hover:shadow-xs"
      )}
    >
      {/* Left Column: Checkbox, Favicon, Title, Description, Tags */}
      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Selection Checkbox */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="pt-0.5 sm:pt-1 flex items-center shrink-0"
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange?.(Boolean(checked))}
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-xs border-muted-foreground/40 data-[state=checked]:border-primary"
          />
        </div>

        {/* Favicon */}
        <div className="pt-0.5 shrink-0">
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-muted/40 border border-border/40">
            <FaviconImage
              url={item.url}
              faviconUrl={item.faviconUrl}
              title={item.title}
              size={14}
            />
          </div>
        </div>

        {/* Content Details */}
        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
              {item.title}
            </span>
            <ExternalLink className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hidden sm:inline-block" />

            {item.package && (
              <span className="text-[9px] sm:text-[10px] text-muted-foreground/70 font-mono px-1 py-0.5 rounded bg-muted/40 shrink-0 max-w-[110px] sm:max-w-none truncate">
                {item.package.name}
                {item.section ? ` / ${item.section.name}` : ""}
              </span>
            )}

            {/* Health Status Indicator */}
            {healthStatus === "alive" && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1 rounded">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {pingLatency}ms
              </span>
            )}
            {healthStatus === "dead" && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-destructive bg-destructive/10 px-1 rounded">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                offline
              </span>
            )}
            {healthStatus === "checking" && (
              <span className="text-[9px] font-mono text-muted-foreground animate-pulse">
                pinging...
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] sm:text-[11px] text-muted-foreground/80 font-mono truncate max-w-[130px] sm:max-w-none">
              {domain}
            </span>
            {item.description && (
              <>
                <span className="text-muted-foreground/40 text-[10px] hidden xs:inline">•</span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground truncate max-w-[130px] sm:max-w-md hidden xs:inline">
                  {item.description}
                </span>
              </>
            )}
            {clickCount > 0 && (
              <>
                <span className="text-muted-foreground/40 text-[10px] hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] text-muted-foreground/60 font-mono" title={`${clickCount} visits`}>
                  <MousePointerClick className="h-2.5 w-2.5" />
                  {clickCount}
                </span>
              </>
            )}
          </div>

          {/* Tags */}
          {item.urlTags && item.urlTags.length > 0 && (
            <div className="flex items-center gap-1 mt-1 sm:mt-1.5 flex-wrap">
              {item.urlTags.map(({ tag }) => (
                <span
                  key={tag.name}
                  className="text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Copy, Favorite, Actions Menu */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-0.5 sm:gap-1 shrink-0"
      >
        {/* Copy Button (desktop/tablet) */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          title="Copy URL"
          className="h-6 w-6 sm:h-7 sm:w-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted hidden sm:inline-flex"
        >
          {copied ? (
            <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          )}
        </Button>

        {/* Favorite Button (Optimistic) */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleOptimisticToggleFavorite}
          title={isFavorite ? "Remove favorite" : "Add to favorites"}
          className="h-6 w-6 sm:h-7 sm:w-7 rounded text-muted-foreground hover:text-amber-500 hover:bg-muted"
        >
          <Star
            className={cn(
              "h-3 w-3 sm:h-3.5 sm:w-3.5",
              isFavorite
                ? "fill-amber-400 text-amber-500"
                : "text-muted-foreground/60"
            )}
          />
        </Button>

        {/* Action Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 sm:h-7 sm:w-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-xs">
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5 mr-2" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyMarkdown}>
              <FileText className="h-3.5 w-3.5 mr-2" />
              Copy as Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCheckHealth}>
              <Activity className="h-3.5 w-3.5 mr-2" />
              Check Link Health
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit?.(item)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove?.(item)}>
              <FolderInput className="h-3.5 w-3.5 mr-2" />
              Move to...
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/notes?urlId=${item.id}`)}>
              <NotebookPen className="h-3.5 w-3.5 mr-2 text-amber-500" />
              Notes
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(item)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export const UrlCard = React.memo(UrlCardComponent);
