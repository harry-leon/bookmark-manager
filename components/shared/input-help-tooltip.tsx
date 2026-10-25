"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InputHelpTooltipProps {
  content: string;
  example?: string;
  className?: string;
}

export function InputHelpTooltip({
  content,
  example,
  className,
}: InputHelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Field guide and tips"
            className={cn(
              "text-muted-foreground/50 hover:text-foreground transition-colors p-0.5 rounded-full outline-hidden cursor-help",
              className
            )}
          >
            <AlertCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="end"
          className="max-w-xs p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg rounded-lg space-y-1"
        >
          <p className="leading-snug">{content}</p>
          {example && (
            <p className="text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/50">
              <span className="font-semibold text-primary">e.g.</span> {example}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
