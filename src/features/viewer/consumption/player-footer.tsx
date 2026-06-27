"use client";

import type { CSSProperties } from "react";

import {
  AudioPlayer,
  AudioPlayerControlBar,
  AudioPlayerElement,
  AudioPlayerMuteButton,
  AudioPlayerPlayButton,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerVolumeRange,
} from "@/components/ai-elements/audio-player";
import { cn } from "@/lib/utils";
import type { VisualTheme } from "@/types/content-metadata";

import { PlayerAtmosphere } from "./player-atmosphere";
import type { useAudioPlayback } from "./use-audio-playback";
import type { ConsumptionSection } from "./consumption-mode";

type Playback = ReturnType<typeof useAudioPlayback>;

interface PlayerFooterProps {
  playback: Playback;
  sections: ConsumptionSection[];
  theme: VisualTheme;
  coverPalette?: [string, string, string] | null;
  title: string;
  className?: string;
}

export function PlayerFooter({
  playback,
  sections,
  theme,
  coverPalette,
  title,
  className,
}: PlayerFooterProps) {
  const accent = coverPalette?.[0] ?? theme.colors[0];

  const { audioRef, audioUrl, audioLoadError, displayDuration } = playback;

  const defaultDuration =
    displayDuration > 0 ? Math.round(displayDuration) : undefined;

  return (
    <footer
      className={cn(
        "sticky bottom-0 z-30 overflow-hidden border-t border-white/10",
        className,
      )}
    >
      <PlayerAtmosphere
        theme={theme}
        playing={playback.playing}
        coverPalette={coverPalette}
      />
      <div className="relative border-t border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl space-y-3 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {sections[playback.activeSegmentIndex]?.title ?? "Playing"}
              </p>
            </div>
          </div>

          {audioLoadError && (
            <p className="text-center text-xs text-destructive">{audioLoadError}</p>
          )}

          {audioUrl ? (
            <AudioPlayer
              defaultDuration={defaultDuration}
              style={
                {
                  "--media-primary-color": accent,
                  "--media-range-bar-color": accent,
                } as CSSProperties
              }
            >
              <AudioPlayerElement
                key={audioUrl}
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
              />
              <AudioPlayerControlBar>
                <AudioPlayerPlayButton />
                <AudioPlayerSeekBackwardButton seekOffset={10} />
                <AudioPlayerSeekForwardButton seekOffset={10} />
                <AudioPlayerTimeDisplay showDuration />
                <AudioPlayerTimeRange />
                <AudioPlayerMuteButton />
                <AudioPlayerVolumeRange />
              </AudioPlayerControlBar>
            </AudioPlayer>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Audio is not available yet.
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
