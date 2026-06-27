"use client";

import { useEffect, useMemo, useRef } from "react";

import { resolveAudioDurationSeconds } from "@/lib/content/audio-duration";
import {
  buildTimedParagraphs,
  findActiveParagraphIndex,
  findActiveWordIndex,
} from "@/lib/content/transcript-timing";
import { cn } from "@/lib/utils";
import type { AudioManifest } from "@/types/content-metadata";

import { useConsumptionStore } from "./use-consumption-store";

interface TranscriptViewProps {
  manifest: AudioManifest;
  activeSegmentIndex: number;
  currentTime?: number;
  duration?: number;
  highlightNarration: boolean;
  creationId?: string;
  className?: string;
}

export function TranscriptView({
  manifest,
  activeSegmentIndex,
  currentTime = 0,
  duration = 0,
  highlightNarration,
  className,
}: TranscriptViewProps) {
  const { autoScroll } = useConsumptionStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLParagraphElement>(null);

  const totalDuration =
    duration > 0
      ? duration
      : resolveAudioDurationSeconds({
          category: manifest.format,
          targetMinutes: manifest.targetDurationMinutes,
          storedActualMinutes: manifest.actualDurationMinutes,
        });

  const timedParagraphs = useMemo(
    () => buildTimedParagraphs(manifest, totalDuration),
    [manifest, totalDuration],
  );

  const activeParagraphIndex = findActiveParagraphIndex(
    timedParagraphs,
    currentTime,
  );

  useEffect(() => {
    if (!autoScroll || !highlightNarration) return;
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeParagraphIndex, autoScroll, highlightNarration, currentTime]);

  if (timedParagraphs.length > 0) {
    return (
      <div ref={scrollRef} className={cn("space-y-4", className)}>
        {timedParagraphs.map((paragraph, index) => {
          const isActive = index === activeParagraphIndex;
          const activeWordIndex = isActive
            ? findActiveWordIndex(paragraph.words, currentTime)
            : -1;

          return (
            <p
              key={`${paragraph.segmentIndex}-${index}`}
              ref={isActive ? activeRef : undefined}
              data-active-transcript={isActive ? "true" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 leading-relaxed transition-colors duration-300",
                highlightNarration &&
                  isActive &&
                  "bg-primary/10 ring-1 ring-primary/20",
              )}
            >
              {paragraph.words.length > 0
                ? paragraph.words.map((word, wordIndex) => (
                    <span
                      key={`${wordIndex}-${word.text}`}
                      className={cn(
                        "mr-1 inline",
                        highlightNarration &&
                          isActive &&
                          wordIndex === activeWordIndex &&
                          "rounded bg-primary/25 px-0.5 font-medium text-primary",
                      )}
                    >
                      {word.text}
                    </span>
                  ))
                : paragraph.text}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {manifest.segments.map((segment, index) => {
        const isActive = index === activeSegmentIndex;
        const text = segment.transcript ?? "";

        return (
          <section key={segment.segmentId} className="space-y-3">
            <h3
              className={cn(
                "text-sm font-semibold uppercase tracking-wider opacity-60",
                isActive && "text-primary opacity-100",
              )}
            >
              {segment.title ?? `Part ${segment.sequence + 1}`}
            </h3>
            {text ? (
              <p
                className={cn(
                  "rounded-lg px-3 py-2 leading-relaxed transition-colors duration-300",
                  highlightNarration &&
                    isActive &&
                    "bg-primary/10 ring-1 ring-primary/20",
                )}
              >
                {text}
              </p>
            ) : (
              <p className="text-sm italic opacity-50">No transcript for this section.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
