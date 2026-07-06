"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CreationCoverArtwork } from "@/components/creation/creation-cover-artwork";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CreationManifestResponse } from "@/lib/content/api-client";
import {
  getTypeBadgeClass,
  getTypeLabel,
} from "@/lib/creation-utils";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";
import type { AudioManifest } from "@/types/content-metadata";

import { AnnotationsPanel } from "./annotations-panel";
import { AssistantPanel } from "./assistant-panel";
import { ConsumptionFooter } from "./consumption-footer";
import {
  isAudioMode,
  resolveConsumptionMode,
  resolveVisualTheme,
} from "./consumption-mode";
import { ContentPane } from "./content-pane";
import { CoverArtMotion } from "./cover-art-motion";
import { MoodBackground } from "./mood-background";
import { resolveSections } from "./resolve-sections";
import { ReaderSettingsMenu } from "./reader-settings-menu";
import { SectionDrawer } from "./section-drawer";
import { SectionNav } from "./section-nav";
import { useAudioPlayback } from "./use-audio-playback";
import {
  READER_THEME_CLASS,
  useConsumptionStore,
} from "./use-consumption-store";
import { useConsumptionEngine } from "./use-consumption-engine";
import { ViewerOptionsMenu } from "./viewer-options-menu";
import { useCoverPalette } from "./use-cover-palette";
import { audioManifestHasTranscript } from "@/lib/content/audio-manifest-transcript";

interface ContentViewerShellProps {
  creation: Creation;
  manifest: CreationManifestResponse;
  className?: string;
}

export function ContentViewerShell({
  creation,
  manifest,
  className,
}: ContentViewerShellProps) {
  const mode = resolveConsumptionMode(manifest);
  const immersive = mode === "book";
  const sections = useMemo(() => resolveSections(manifest), [manifest]);
  const theme = resolveVisualTheme(manifest, creation.topic);
  const manifestCoverAssetId =
    manifest.type !== "story"
      ? (manifest.manifest as AudioManifest).coverAssetId
      : manifest.manifest.coverAssetId;
  const coverUrl =
    creation.coverUrl ??
    (manifestCoverAssetId
      ? manifest.assets[manifestCoverAssetId]
      : undefined);

  const coverPalette = useCoverPalette(coverUrl);
  const seekHandlerRef = useRef<(from: number, to: number) => void>(() => {});

  const {
    activeSectionIndex,
    setActiveSectionIndex,
    sectionDrawerOpen,
    setSectionDrawerOpen,
    readerTheme,
  } = useConsumptionStore();

  useEffect(() => {
    setActiveSectionIndex(0);
  }, [creation.id, setActiveSectionIndex]);

  useLayoutEffect(() => {
    if (!immersive) return;
    document.documentElement.dataset.readerTheme = readerTheme;
    return () => {
      delete document.documentElement.dataset.readerTheme;
    };
  }, [immersive, readerTheme]);

  const audioManifest =
    manifest.type !== "story" ? (manifest.manifest as AudioManifest) : null;
  const hasTranscript = audioManifest
    ? audioManifestHasTranscript(audioManifest)
    : false;
  const playback = useAudioPlayback(
    audioManifest ?? {
      version: 1,
      format: "audiobook",
      title: creation.title,
      targetDurationMinutes: 1,
      actualDurationMinutes: 0,
      language: "en",
      coverAssetId: "00000000-0000-0000-0000-000000000001",
      speakers: [],
      segments: [],
    },
    manifest.assets,
    {
      enabled: isAudioMode(mode),
      onSeek: (from, to) => seekHandlerRef.current(from, to),
    },
  );

  const { emitBookmark, emitHighlight } = useConsumptionEngine({
    creation,
    manifest,
    mode,
    sectionsLength: sections.length,
    activeSectionIndex,
    setActiveSectionIndex,
    bindSeek: seekHandlerRef,
    playback: isAudioMode(mode)
      ? {
          currentTime: playback.currentTime,
          duration: playback.duration,
          playing: playback.playing,
          audioReady: playback.audioReady,
          activeSegmentIndex: playback.activeSegmentIndex,
          restoreProgress: playback.restoreProgress,
          restorePosition: playback.restorePosition,
        }
      : undefined,
  });

  const handleSectionSelect = useCallback(
    (index: number) => {
      setActiveSectionIndex(index);
      if (isAudioMode(mode)) {
        playback.jumpToSegment(index);
      }
    },
    [mode, playback, setActiveSectionIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== "book") return;
      if (e.key === "ArrowLeft") {
        setActiveSectionIndex(Math.max(0, activeSectionIndex - 1));
      }
      if (e.key === "ArrowRight") {
        setActiveSectionIndex(
          Math.min(sections.length - 1, activeSectionIndex + 1),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSectionIndex, mode, sections.length, setActiveSectionIndex]);

  const activeSegmentIndex = isAudioMode(mode)
    ? playback.activeSegmentIndex
    : activeSectionIndex;

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col",
        immersive && "reader-immersive",
        immersive && READER_THEME_CLASS[readerTheme],
        className,
      )}
    >
      <header
        className={cn(
          "sticky top-0 z-20 border-b backdrop-blur-md",
          immersive
            ? "reader-chrome border-[var(--reader-border)]"
            : "border-border/60 bg-background/90",
        )}
      >
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-3 md:gap-3 md:px-6">
          <Link
            href="/"
            aria-label="Back to library"
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
              immersive
                ? "hover:bg-[var(--reader-surface)]"
                : "hover:bg-accent",
            )}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">{creation.title}</h1>
            <Badge
              variant="secondary"
              className={cn(
                "mt-0.5 font-normal",
                immersive
                  ? "border-[var(--reader-border)] bg-[var(--reader-surface)] text-[var(--reader-muted)]"
                  : getTypeBadgeClass(creation.type),
              )}
            >
              {getTypeLabel(creation.type)}
            </Badge>
          </div>
          <AnnotationsPanel
            creationId={creation.id}
            activePage={activeSectionIndex + 1}
            onJumpToPage={(page) => handleSectionSelect(page - 1)}
            onBookmarkSaved={(payload) => emitBookmark(payload)}
            immersive={immersive}
          />
          <SectionDrawer
            sections={sections}
            activeIndex={activeSectionIndex}
            mode={mode}
            onSelect={handleSectionSelect}
            open={sectionDrawerOpen}
            onOpenChange={setSectionDrawerOpen}
            creationId={creation.id}
            pageCount={
              manifest.type === "story" ? manifest.manifest.pageCount : sections.length
            }
            onPrevious={
              mode === "book"
                ? () => handleSectionSelect(Math.max(0, activeSectionIndex - 1))
                : undefined
            }
            onNext={
              mode === "book"
                ? () =>
                    handleSectionSelect(
                      Math.min(sections.length - 1, activeSectionIndex + 1),
                    )
                : undefined
            }
            immersive={immersive}
          />
          <ReaderSettingsMenu
            mode={mode}
            immersive={immersive}
            hasTranscript={mode === "book" ? true : hasTranscript}
          />
          <ViewerOptionsMenu creation={creation} immersive={immersive} />
        </div>
      </header>

      {/* Mobile hero — audio only; book mode uses title page + mood ambience */}
      {!immersive && (
        <div className="relative border-b border-border/60 md:hidden">
          <MoodBackground
            theme={theme}
            playing={playback.playing}
            coverPalette={coverPalette}
          />
          <div className="relative flex flex-col items-center gap-4 px-4 py-6">
            {coverUrl ? (
              <CoverArtMotion
                coverUrl={coverUrl}
                playing={playback.playing}
                glowColor={coverPalette?.[0] ?? theme.colors[0]}
                className="aspect-[3/4] w-36"
              />
            ) : (
              <CreationCoverArtwork
                creation={creation}
                variant="square"
                className="w-36"
              />
            )}
            {isAudioMode(mode) && (
              <Button
                size="lg"
                className="rounded-full px-8"
                disabled={!playback.audioUrl || !playback.audioReady}
                onClick={() => void playback.togglePlay()}
              >
                {playback.playing ? "Pause" : "Play"}
              </Button>
            )}
            <p className="text-sm font-medium text-muted-foreground">
              {sections[activeSectionIndex]?.title}
            </p>
          </div>
        </div>
      )}

      <div className="relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1">
        {immersive && (
          <MoodBackground
            theme={theme}
            playing={false}
            coverPalette={coverPalette}
            className="opacity-[0.12]"
          />
        )}

        <SectionNav
          sections={sections}
          activeIndex={activeSectionIndex}
          mode={mode}
          onSelect={handleSectionSelect}
          immersive={immersive}
          className="relative z-10 hidden w-60 shrink-0 lg:flex"
        />

        <ContentPane
          manifest={manifest}
          mode={mode}
          activeSectionIndex={activeSectionIndex}
          activeSegmentIndex={activeSegmentIndex}
          creationId={creation.id}
          currentTime={isAudioMode(mode) ? playback.currentTime : undefined}
          duration={isAudioMode(mode) ? playback.duration : undefined}
          onHighlightSaved={(payload) => emitHighlight(payload)}
          immersive={immersive}
        />

        {!immersive && <AssistantPanel creation={creation} />}
      </div>

      <ConsumptionFooter
        mode={mode}
        manifest={manifest}
        sections={sections}
        activeSectionIndex={activeSectionIndex}
        onSectionChange={handleSectionSelect}
        theme={theme}
        coverPalette={coverPalette}
        playback={isAudioMode(mode) ? playback : undefined}
        title={creation.title}
        immersive={immersive}
      />
    </div>
  );
}
