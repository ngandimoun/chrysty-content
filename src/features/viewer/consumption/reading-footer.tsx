"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  READER_WIDTH_CLASS,
  useConsumptionStore,
} from "./use-consumption-store";

interface ReadingFooterProps {
  pageIndex: number;
  pageCount: number;
  minutesLeft: number;
  progressPercent: number;
  chapterTitle?: string;
  immersive?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
}

export function ReadingFooter({
  pageIndex,
  pageCount,
  minutesLeft,
  progressPercent,
  chapterTitle,
  immersive = false,
  onPrevious,
  onNext,
  className,
}: ReadingFooterProps) {
  const { contentWidth } = useConsumptionStore();
  const atStart = pageIndex <= 0;
  const atEnd = pageIndex >= pageCount - 1;

  return (
    <footer
      className={cn(
        "sticky bottom-0 z-30 border-t backdrop-blur-xl",
        immersive
          ? "reader-chrome border-[var(--reader-border)] bg-[color-mix(in_oklch,var(--reader-bg)_95%,transparent)]"
          : "border-border/60 bg-background/95",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-16 lg:px-20",
          READER_WIDTH_CLASS[contentWidth],
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-full md:hidden",
              immersive &&
                "border-[var(--reader-border)] bg-[var(--reader-surface)] text-[var(--reader-fg)]",
            )}
            onClick={onPrevious}
            disabled={atStart || !onPrevious}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "hidden rounded-lg md:inline-flex",
              immersive &&
                "border-[var(--reader-border)] bg-[var(--reader-surface)] text-[var(--reader-fg)]",
            )}
            onClick={onPrevious}
            disabled={atStart || !onPrevious}
          >
            <ChevronLeft className="mr-1 size-4" />
            Previous
          </Button>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {chapterTitle && (
            <p
              className={cn(
                "truncate text-center text-sm font-medium md:text-left",
                immersive ? "text-[var(--reader-fg)]" : "text-foreground",
              )}
            >
              {chapterTitle}
            </p>
          )}
          <div
            className={cn(
              "flex justify-between text-xs",
              immersive
                ? "text-[var(--reader-muted)]"
                : "text-muted-foreground",
            )}
          >
            <span>
              Page {pageIndex + 1} of {pageCount}
            </span>
            <span>{minutesLeft} min left</span>
          </div>
          <div
            className={cn(
              "h-1.5 overflow-hidden rounded-full",
              immersive ? "bg-[var(--reader-border)]" : "bg-muted",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                immersive ? "bg-[var(--reader-accent)]" : "bg-primary",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "rounded-full md:hidden",
            immersive &&
              "border-[var(--reader-border)] bg-[var(--reader-surface)] text-[var(--reader-fg)]",
          )}
          onClick={onNext}
          disabled={atEnd || !onNext}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "hidden rounded-lg md:inline-flex",
            immersive &&
              "border-[var(--reader-border)] bg-[var(--reader-surface)] text-[var(--reader-fg)]",
          )}
          onClick={onNext}
          disabled={atEnd || !onNext}
        >
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </footer>
  );
}
