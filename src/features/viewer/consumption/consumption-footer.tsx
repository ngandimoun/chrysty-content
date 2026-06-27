"use client";

import type { CreationManifestResponse } from "@/lib/content/api-client";

import { isAudioMode, type ConsumptionMode } from "./consumption-mode";
import { PlayerFooter } from "./player-footer";
import { ReadingFooter } from "./reading-footer";
import { estimateBookReadingMinutes } from "./resolve-sections";
import type { useAudioPlayback } from "./use-audio-playback";
import type { ConsumptionSection } from "./consumption-mode";
import type { VisualTheme } from "@/types/content-metadata";

type Playback = ReturnType<typeof useAudioPlayback>;

interface ConsumptionFooterProps {
  mode: ConsumptionMode;
  manifest: CreationManifestResponse;
  sections: ConsumptionSection[];
  activeSectionIndex: number;
  onSectionChange?: (index: number) => void;
  theme: VisualTheme;
  coverPalette?: [string, string, string] | null;
  playback?: Playback;
  title: string;
  immersive?: boolean;
}

export function ConsumptionFooter({
  mode,
  manifest,
  sections,
  activeSectionIndex,
  onSectionChange,
  theme,
  coverPalette,
  playback,
  title,
  immersive = false,
}: ConsumptionFooterProps) {
  if (isAudioMode(mode) && playback) {
    return (
      <PlayerFooter
        playback={playback}
        sections={sections}
        theme={theme}
        coverPalette={coverPalette}
        title={title}
      />
    );
  }

  if (manifest.type !== "story") return null;

  const pageCount = manifest.manifest.pageCount;
  const totalMinutes = estimateBookReadingMinutes(manifest);
  const progressPercent = ((activeSectionIndex + 1) / pageCount) * 100;
  const minutesLeft = Math.max(
    0,
    Math.round(totalMinutes * (1 - activeSectionIndex / pageCount)),
  );

  return (
    <ReadingFooter
      pageIndex={activeSectionIndex}
      pageCount={pageCount}
      minutesLeft={minutesLeft}
      progressPercent={progressPercent}
      chapterTitle={sections[activeSectionIndex]?.title}
      immersive={immersive}
      onPrevious={
        onSectionChange
          ? () => onSectionChange(Math.max(0, activeSectionIndex - 1))
          : undefined
      }
      onNext={
        onSectionChange
          ? () =>
              onSectionChange(
                Math.min(pageCount - 1, activeSectionIndex + 1),
              )
          : undefined
      }
    />
  );
}
