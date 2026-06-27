"use client";

import { useQuery } from "@tanstack/react-query";
import { Bookmark, ChevronLeft, ChevronRight, List } from "lucide-react";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fetchAnnotationsViaApi } from "@/lib/content/api-client";
import { cn } from "@/lib/utils";

import { SectionNav } from "./section-nav";
import { READER_PORTAL_SURFACE, getReaderPortalStyle, useConsumptionStore } from "./use-consumption-store";
import type { ConsumptionMode, ConsumptionSection } from "./consumption-mode";

interface SectionDrawerProps {
  sections: ConsumptionSection[];
  activeIndex: number;
  mode: ConsumptionMode;
  onSelect: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creationId?: string;
  pageCount?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  immersive?: boolean;
}

export function SectionDrawer({
  sections,
  activeIndex,
  mode,
  onSelect,
  open,
  onOpenChange,
  creationId,
  pageCount,
  onPrevious,
  onNext,
  immersive = false,
}: SectionDrawerProps) {
  const auth = useOptionalAuth();
  const { readerTheme } = useConsumptionStore();
  const portalStyle = immersive ? getReaderPortalStyle(readerTheme) : undefined;
  const label = mode === "podcast" ? "Segments" : "Chapters";
  const totalPages = pageCount ?? sections.length;
  const progressPercent =
    totalPages > 0 ? ((activeIndex + 1) / totalPages) * 100 : 0;

  const { data: annotations = [] } = useQuery({
    queryKey: ["annotations", creationId],
    queryFn: () =>
      fetchAnnotationsViaApi(creationId!, auth?.getAuthHeaders()),
    enabled: open && Boolean(creationId) && mode === "book",
  });

  const bookmarks = annotations.filter((a) => a.kind === "bookmark");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-xl lg:hidden",
              immersive &&
                "border-[var(--reader-border)] bg-[var(--reader-surface)] text-[var(--reader-fg)]",
            )}
          >
            <List className="size-4" />
            <span className="sr-only">{label}</span>
          </Button>
        }
      />
      <SheetContent
        side="left"
        className={cn(
          "flex w-80 flex-col p-0",
          immersive && READER_PORTAL_SURFACE,
        )}
        style={portalStyle}
      >
        <SheetHeader
          className={cn(
            "border-b px-4 py-3",
            immersive && "border-[var(--reader-border)]",
          )}
        >
          <SheetTitle>{label}</SheetTitle>
          {mode === "book" && totalPages > 0 && (
            <div className="space-y-2 pt-2">
              <div
                className={cn(
                  "flex justify-between text-xs",
                  immersive
                    ? "text-[var(--reader-muted)]"
                    : "text-muted-foreground",
                )}
              >
                <span>Progress</span>
                <span>
                  Page {activeIndex + 1} / {totalPages}
                </span>
              </div>
              <div
                className={cn(
                  "h-1.5 overflow-hidden rounded-full",
                  immersive ? "bg-[var(--reader-border)]" : "bg-muted",
                )}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    immersive ? "bg-[var(--reader-accent)]" : "bg-primary",
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 rounded-lg",
                    immersive &&
                      "border-[var(--reader-border)] bg-[var(--reader-surface)] text-[var(--reader-fg)]",
                  )}
                  onClick={onPrevious}
                  disabled={activeIndex <= 0 || !onPrevious}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 rounded-lg",
                    immersive &&
                      "border-[var(--reader-border)] bg-[var(--reader-surface)] text-[var(--reader-fg)]",
                  )}
                  onClick={onNext}
                  disabled={activeIndex >= totalPages - 1 || !onNext}
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetHeader>

        {mode === "book" && bookmarks.length > 0 && (
          <div
            className={cn(
              "border-b px-4 py-3",
              immersive && "border-[var(--reader-border)]",
            )}
          >
            <p
              className={cn(
                "mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wider",
                immersive
                  ? "text-[var(--reader-muted)]"
                  : "text-muted-foreground",
              )}
            >
              <Bookmark className="size-3.5" />
              Bookmarks
            </p>
            <ul className="max-h-32 space-y-1 overflow-y-auto">
              {bookmarks.map((bookmark) => (
                <li key={bookmark.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      if (bookmark.pageNumber) {
                        onSelect(bookmark.pageNumber - 1);
                        onOpenChange(false);
                      }
                    }}
                  >
                    Page {bookmark.pageNumber}
                    {bookmark.anchorText ? ` — ${bookmark.anchorText}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <SectionNav
          sections={sections}
          activeIndex={activeIndex}
          mode={mode}
          onSelect={(index) => {
            onSelect(index);
            onOpenChange(false);
          }}
          immersive={immersive}
          className="min-h-0 flex-1 overflow-y-auto border-0"
        />
      </SheetContent>
    </Sheet>
  );
}
