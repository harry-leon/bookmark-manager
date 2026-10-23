import React from "react";
import { FolderPlus, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderPlus,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-8 text-center animate-in fade-in-50 ${className}`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/60 text-muted-foreground ring-4 ring-muted/20">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size="sm"
          variant="outline"
          className="mt-4 h-8 text-xs font-medium shadow-none hover:bg-accent"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
