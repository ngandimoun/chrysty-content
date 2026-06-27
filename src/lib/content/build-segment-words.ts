import type { AudioManifest } from "@/types/content-metadata";

import { buildWordsForSegment, buildSegmentOffsets } from "./transcript-timing";

export function enrichManifestSegmentsWithWords(
  manifest: AudioManifest,
  totalDurationSeconds: number,
): AudioManifest["segments"] {
  const offsets = buildSegmentOffsets(manifest.segments, totalDurationSeconds);

  return manifest.segments.map((segment, index) => {
    const start = offsets[index] ?? 0;
    const end = offsets[index + 1] ?? totalDurationSeconds;
    const duration = Math.max(0, end - start);
    const transcript = segment.transcript ?? "";
    const words = buildWordsForSegment(transcript, index, start, duration);

    return {
      ...segment,
      words: words.map(({ text, startSeconds, endSeconds }) => ({
        text,
        startSeconds,
        endSeconds,
      })),
    };
  });
}
