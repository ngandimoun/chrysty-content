"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Highlighter, Trash2 } from "lucide-react";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  createAnnotationViaApi,
  deleteAnnotationViaApi,
  fetchAnnotationsViaApi,
} from "@/lib/content/api-client";
import { cn } from "@/lib/utils";
import type { ConsumptionAnnotation } from "@/types/consumption";

import { READER_PORTAL_SURFACE, getReaderPortalStyle, useConsumptionStore } from "./use-consumption-store";

interface AnnotationsPanelProps {
  creationId: string;
  activePage: number;
  onJumpToPage: (page: number) => void;
  onBookmarkSaved?: (payload: Record<string, unknown>) => void;
  immersive?: boolean;
}

export function AnnotationsPanel({
  creationId,
  activePage,
  onJumpToPage,
  onBookmarkSaved,
  immersive = false,
}: AnnotationsPanelProps) {
  const auth = useOptionalAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { readerTheme } = useConsumptionStore();
  const portalStyle = immersive ? getReaderPortalStyle(readerTheme) : undefined;

  const { data: annotations = [] } = useQuery({
    queryKey: ["annotations", creationId],
    queryFn: () =>
      fetchAnnotationsViaApi(creationId, auth?.getAuthHeaders()),
    enabled: open,
  });

  const addBookmark = useCallback(async () => {
    await createAnnotationViaApi(
      creationId,
      {
        kind: "bookmark",
        pageNumber: activePage,
        anchorText: `Page ${activePage}`,
      },
      auth?.getAuthHeaders(),
    );
    onBookmarkSaved?.({ pageNumber: activePage });
    void queryClient.invalidateQueries({ queryKey: ["annotations", creationId] });
  }, [activePage, auth, creationId, onBookmarkSaved, queryClient]);

  const remove = useCallback(
    async (id: string) => {
      await deleteAnnotationViaApi(creationId, id, auth?.getAuthHeaders());
      void queryClient.invalidateQueries({ queryKey: ["annotations", creationId] });
    },
    [auth, creationId, queryClient],
  );

  const bookmarks = annotations.filter((a) => a.kind === "bookmark");
  const highlights = annotations.filter((a) => a.kind === "highlight");
  const notes = annotations.filter((a) => a.kind === "note" || a.kind === "quote");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-xl",
              immersive &&
                "text-[var(--reader-fg)] hover:bg-[var(--reader-surface)]",
            )}
            aria-label="Bookmarks and notes"
          >
            <Bookmark className="size-4" />
          </Button>
        }
      />
      <SheetContent
        side="right"
        className={cn(
          "w-full sm:max-w-md",
          immersive && READER_PORTAL_SURFACE,
        )}
        style={portalStyle}
      >
        <SheetHeader>
          <SheetTitle>Bookmarks & notes</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          <Button
            variant="outline"
            className={cn(
              "w-full rounded-xl",
              immersive &&
                "border-[var(--reader-border)] bg-[var(--reader-surface)] text-[var(--reader-fg)]",
            )}
            onClick={() => void addBookmark()}
          >
            Bookmark page {activePage}
          </Button>

          <AnnotationSection
            title="Bookmarks"
            icon={Bookmark}
            items={bookmarks}
            onSelect={(item) => {
              if (item.pageNumber) {
                onJumpToPage(item.pageNumber);
                setOpen(false);
              }
            }}
            onDelete={remove}
          />
          <AnnotationSection
            title="Highlights"
            icon={Highlighter}
            items={highlights}
            onDelete={remove}
          />
          <AnnotationSection title="Notes" icon={Bookmark} items={notes} onDelete={remove} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AnnotationSection({
  title,
  icon: Icon,
  items,
  onSelect,
  onDelete,
}: {
  title: string;
  icon: typeof Bookmark;
  items: ConsumptionAnnotation[];
  onSelect?: (item: ConsumptionAnnotation) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No {title.toLowerCase()} yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2 rounded-lg border border-border/60 p-2 text-sm"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelect?.(item)}
              >
                {item.selectedText ?? item.anchorText ?? item.noteText ?? title}
                {item.pageNumber ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Page {item.pageNumber}
                  </span>
                ) : null}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                aria-label="Delete"
                onClick={() => void onDelete(item.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
