"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Highlighter } from "lucide-react";
import { toast } from "sonner";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import type { CreationManifestResponse } from "@/lib/content/api-client";
import { createAnnotationViaApi } from "@/lib/content/api-client";
import { cn } from "@/lib/utils";

import { BookPageView } from "./book-page-view";
import { AudioArtworkPane } from "./audio-artwork-pane";
import { resolveChapterNumber } from "./chapter-utils";
import {
  READER_FONT_CLASS,
  READER_LINE_CLASS,
  READER_WIDTH_CLASS,
  useConsumptionStore,
} from "./use-consumption-store";
import { TranscriptView } from "./transcript-view";
import { isAudioMode, type ConsumptionMode } from "./consumption-mode";
import { audioManifestHasTranscript } from "@/lib/content/audio-manifest-transcript";
import type { AudioManifest } from "@/types/content-metadata";

interface ContentPaneProps {
  manifest: CreationManifestResponse;
  mode: ConsumptionMode;
  activeSectionIndex: number;
  activeSegmentIndex?: number;
  creationId?: string;
  currentTime?: number;
  duration?: number;
  onHighlightSaved?: (payload: Record<string, unknown>) => void;
  pageCount?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  immersive?: boolean;
  className?: string;
}

export function ContentPane({
  manifest,
  mode,
  activeSectionIndex,
  activeSegmentIndex = 0,
  creationId,
  currentTime,
  duration,
  onHighlightSaved,
  pageCount: _pageCount,
  onPrevious: _onPrevious,
  onNext: _onNext,
  immersive = false,
  className,
}: ContentPaneProps) {
  const auth = useOptionalAuth();
  const { fontSize, lineHeight, contentWidth, highlightNarration, autoScroll } =
    useConsumptionStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const saveHighlight = useCallback(
    async (text: string) => {
      if (!creationId || !text.trim()) return;
      try {
        await createAnnotationViaApi(
          creationId,
          {
            kind: "highlight",
            pageNumber: activeSectionIndex + 1,
            selectedText: text.trim(),
          },
          auth?.getAuthHeaders(),
        );
        onHighlightSaved?.({
          pageNumber: activeSectionIndex + 1,
          selectedText: text.trim(),
        });
        toast.success("Highlight saved");
      } catch {
        toast.error("Could not save highlight");
      }
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    },
    [activeSectionIndex, auth, creationId, onHighlightSaved],
  );

  useEffect(() => {
    if (mode !== "book") return;
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeSectionIndex, mode]);

  useEffect(() => {
    if (!autoScroll || mode !== "book") return;
    const container = scrollRef.current;
    if (!container) return;
    const active = container.querySelector("[data-active-page='true']");
    active?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSectionIndex, autoScroll, mode]);

  const onMouseUp = () => {
    if (mode !== "book" || !creationId) return;
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) {
      setSelection(null);
      return;
    }
    const range = sel?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    if (rect) {
      setSelection({ text, x: rect.left, y: rect.top - 8 });
    }
  };

  const bookManifest =
    manifest.type === "story" ? manifest.manifest : null;
  const activePage = bookManifest?.pages[activeSectionIndex];
  const chapterNumber =
    bookManifest && activePage
      ? resolveChapterNumber(bookManifest.pages, activePage.pageNumber)
      : null;
  const coverAssetId = bookManifest?.coverAssetId;
  const coverUrl = coverAssetId ? manifest.assets[coverAssetId] : undefined;

  const audioManifest =
    isAudioMode(mode) && manifest.type !== "story"
      ? (manifest.manifest as AudioManifest)
      : null;
  const audioCoverAssetId = audioManifest?.coverAssetId;
  const audioCoverUrl = audioCoverAssetId
    ? manifest.assets[audioCoverAssetId]
    : undefined;
  const showTranscript =
    audioManifest !== null && audioManifestHasTranscript(audioManifest);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "relative z-10 min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-16 md:py-10 lg:px-20",
        READER_FONT_CLASS[fontSize],
        className,
      )}
      onMouseUp={onMouseUp}
    >
      {mode === "book" && bookManifest && activePage ? (
        <div
          data-active-page="true"
          className={cn(
            "mx-auto w-full",
            READER_WIDTH_CLASS[contentWidth],
            immersive && "reader-column-shadow rounded-lg px-4 py-6 md:px-8 md:py-8",
          )}
        >
          <BookPageView
            page={activePage}
            assets={manifest.assets}
            bookTitle={bookManifest.title}
            coverUrl={coverUrl}
            chapterNumber={chapterNumber}
            lineHeightClass={READER_LINE_CLASS[lineHeight]}
          />
        </div>
      ) : audioManifest ? (
        showTranscript ? (
          <TranscriptView
            manifest={audioManifest}
            activeSegmentIndex={activeSegmentIndex}
            currentTime={currentTime}
            duration={duration}
            highlightNarration={highlightNarration}
            creationId={creationId}
          />
        ) : (
          <AudioArtworkPane
            manifest={audioManifest}
            coverUrl={audioCoverUrl}
            activeSegmentIndex={activeSegmentIndex}
          />
        )
      ) : null}

      {selection && (
        <div
          className={cn(
            "fixed z-50 flex gap-1 rounded-lg border p-1 shadow-lg",
            immersive
              ? "reader-chrome-surface border-[var(--reader-border)]"
              : "border-border bg-popover",
          )}
          style={{ left: selection.x, top: selection.y }}
        >
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1 rounded-md text-xs"
            onClick={() => void saveHighlight(selection.text)}
          >
            <Highlighter className="size-3.5" />
            Highlight
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-md text-xs"
            onClick={() => void saveHighlight(`${selection.text}\n\n[note pending]`)}
          >
            Note
          </Button>
        </div>
      )}
    </div>
  );
}
