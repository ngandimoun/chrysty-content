"use client";

import { MoodBackground } from "./mood-background";
import type { VisualTheme } from "@/types/content-metadata";
import { cn } from "@/lib/utils";

interface PlayerAtmosphereProps {
  theme: VisualTheme;
  playing: boolean;
  coverPalette?: [string, string, string] | null;
  className?: string;
}

export function PlayerAtmosphere({
  theme,
  playing,
  coverPalette,
  className,
}: PlayerAtmosphereProps) {
  return (
    <div className={cn("relative", className)}>
      <MoodBackground
        theme={theme}
        playing={playing}
        coverPalette={coverPalette}
      />
    </div>
  );
}
