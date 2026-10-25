"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function PaginationControls({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
  className,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const startItem = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, total);

  // Generate visible page numbers with smart ellipsis
  function getVisiblePages(): (number | string)[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safePage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (safePage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
  }

  const pages = getVisiblePages();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-2 text-xs text-muted-foreground",
        className
      )}
    >
      {/* Left info: Items range & Total count */}
      <div className="flex items-center gap-2 font-mono text-[11px]">
        <span>
          Showing <strong className="font-semibold text-foreground">{startItem}</strong> -{" "}
          <strong className="font-semibold text-foreground">{endItem}</strong> of{" "}
          <strong className="font-semibold text-foreground">{total}</strong> items
        </span>

        {/* Optional Page Size Selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border/60">
            <span className="text-[11px] text-muted-foreground">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-6 rounded border border-input bg-transparent px-1.5 text-[11px] font-mono shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-popover text-popover-foreground">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right controls: Page Buttons */}
      <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-end">
        {/* Mobile Page Indicator */}
        <div className="flex items-center sm:hidden font-mono text-[11px] text-muted-foreground mr-auto">
          Page <strong className="font-semibold text-foreground mx-1">{safePage}</strong> of{" "}
          <span className="font-semibold text-foreground ml-1">{totalPages}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1}
            title="First page"
            className="h-7 w-7 text-xs disabled:opacity-30"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Prev Page */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            title="Previous page"
            className="h-7 w-7 text-xs disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Page Numbers - Desktop / Tablet only */}
          <div className="hidden sm:flex items-center gap-1 mx-1">
            {pages.map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground select-none">
                    …
                  </span>
                );
              }

              const pageNum = p as number;
              const isActive = pageNum === safePage;

              return (
                <Button
                  key={pageNum}
                  variant={isActive ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "h-7 w-7 text-xs font-mono transition-all",
                    isActive
                      ? "font-bold shadow-xs pointer-events-none"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            title="Next page"
            className="h-7 w-7 text-xs disabled:opacity-30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage >= totalPages}
            title="Last page"
            className="h-7 w-7 text-xs disabled:opacity-30"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
