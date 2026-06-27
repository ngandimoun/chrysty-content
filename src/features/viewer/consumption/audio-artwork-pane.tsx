"use client";

import { cn } from "@/lib/utils";
import type { AudioManifest } from "@/types/content-metadata";

import { CoverArtMotion } from "./cover-art-motion";

interface AudioArtworkPaneProps {
  manifest: AudioManifest;
  coverUrl?: string;
  activeSegmentIndex: number;
  glowColor?: string;
  className?: string;
}

export function AudioArtworkPane({
  manifest,
  coverUrl,
  activeSegmentIndex,
  glowColor,
  className,
}: AudioArtworkPaneProps) {
  const segment = manifest.segments[activeSegmentIndex];
  const segmentTitle = segment?.title ?? `Part ${activeSegmentIndex + 1}`;

  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center gap-6 py-8 text-center",
        className,
      )}
    >
      {coverUrl ? (
        <CoverArtMotion
          coverUrl={coverUrl}
          playing={false}
          glowColor={glowColor}
          className="aspect-[3/4] w-full max-w-xs"
        />
      ) : null}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">{manifest.title}</h2>
        <p className="text-sm text-muted-foreground">{segmentTitle}</p>
      </div>
    </div>
  );
}
