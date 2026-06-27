"use client";

import { BookOpen, Mic, Radio } from "lucide-react";

import { CreationCoverArtwork } from "@/components/creation/creation-cover-artwork";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getCategoryAccent } from "@/lib/generation-ui";
import { creationArtworkClass } from "@/lib/creation-utils";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

interface GeneratingCardArtworkProps {
  creation: Creation;
  className?: string;
}

function CategoryOverlay({
  creation,
  reducedMotion,
}: {
  creation: Creation;
  reducedMotion: boolean;
}) {
  const accent = getCategoryAccent(creation.category);

  if (creation.category === "story") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn("rounded-full blur-3xl", accent.glow, "size-32 opacity-60")}
          aria-hidden
        />
        <BookOpen
          className="relative z-10 size-10 text-white/80 drop-shadow-lg"
          aria-hidden
        />
      </div>
    );
  }

  if (creation.category === "audiobook") {
    return (
      <div className="absolute inset-x-0 bottom-6 flex items-end justify-center gap-1.5 px-8">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 rounded-full bg-white/70",
              !reducedMotion && "gen-eq-bar",
            )}
            style={{
              height: `${18 + (i % 3) * 10}px`,
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "absolute size-16 rounded-full border-2 border-white/50",
            !reducedMotion && "gen-pulse-ring",
          )}
          style={{ animationDelay: `${i * 0.7}s` }}
        />
      ))}
      <Mic className="relative z-10 size-9 text-white/85 drop-shadow-lg" aria-hidden />
      <Radio
        className="absolute right-6 top-6 size-4 text-white/50"
        aria-hidden
      />
    </div>
  );
}

export function GeneratingCardArtwork({
  creation,
  className,
}: GeneratingCardArtworkProps) {
  const reducedMotion = useReducedMotion();
  const accent = getCategoryAccent(creation.category);
  const showCover = Boolean(creation.coverUrl);
  const dimmed = creation.status === "failed";

  return (
    <div className={cn("relative aspect-[21/9] overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-0",
          !reducedMotion && "gen-mesh-drift",
          creationArtworkClass(creation),
          dimmed && "opacity-60 saturate-50",
        )}
        aria-hidden
      />
      <div
        className={cn("absolute inset-0 bg-gradient-to-br", accent.overlay)}
        aria-hidden
      />
      {!showCover && (
        <CategoryOverlay creation={creation} reducedMotion={reducedMotion} />
      )}
      {!reducedMotion && !showCover && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="gen-shimmer-sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>
      )}
      {showCover && (
        <CreationCoverArtwork
          creation={creation}
          variant="banner"
          className="absolute inset-0"
          reducedMotion={reducedMotion}
          animated
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      {creation.status === "generating" && (
        <div className="absolute left-3 top-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm",
              accent.ring,
              "ring-1",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full bg-white",
                !reducedMotion && "animate-pulse",
              )}
            />
            Creating
          </span>
        </div>
      )}
    </div>
  );
}
