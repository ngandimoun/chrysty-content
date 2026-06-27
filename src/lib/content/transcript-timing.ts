import type { AudioManifest } from "@/types/content-metadata";

export interface TimedWord {
  text: string;
  startSeconds: number;
  endSeconds: number;
  segmentIndex: number;
}

export interface TimedParagraph {
  text: string;
  startSeconds: number;
  endSeconds: number;
  segmentIndex: number;
  words: TimedWord[];
}

export function buildSegmentOffsets(
  segments: AudioManifest["segments"],
  totalDuration: number,
): number[] {
  const plannedTotal = segments.reduce((sum, s) => sum + s.durationSeconds, 0);
  if (totalDuration <= 0 || plannedTotal <= 0) {
    let offset = 0;
    return segments.map((seg) => {
      const start = offset;
      offset += seg.durationSeconds;
      return start;
    });
  }

  let offset = 0;
  return segments.map((seg) => {
    const start = offset;
    offset += (seg.durationSeconds / plannedTotal) * totalDuration;
    return start;
  });
}

export function buildWordsForSegment(
  text: string,
  segmentIndex: number,
  startSeconds: number,
  durationSeconds: number,
): TimedWord[] {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || durationSeconds <= 0) return [];

  const perWord = durationSeconds / tokens.length;
  return tokens.map((word, i) => ({
    text: word,
    startSeconds: startSeconds + i * perWord,
    endSeconds: startSeconds + (i + 1) * perWord,
    segmentIndex,
  }));
}

export function buildTimedParagraphs(
  manifest: AudioManifest,
  totalDuration: number,
): TimedParagraph[] {
  const offsets = buildSegmentOffsets(manifest.segments, totalDuration);
  const paragraphs: TimedParagraph[] = [];

  for (let i = 0; i < manifest.segments.length; i++) {
    const segment = manifest.segments[i]!;
    const start = offsets[i] ?? 0;
    const end = offsets[i + 1] ?? totalDuration;
    const duration = Math.max(0, end - start);

    if (segment.words && segment.words.length > 0) {
      const chunkStart = segment.words[0]!.startSeconds;
      const chunkEnd = segment.words[segment.words.length - 1]!.endSeconds;
      const text = segment.words.map((w) => w.text).join(" ");
      paragraphs.push({
        text,
        startSeconds: chunkStart,
        endSeconds: chunkEnd,
        segmentIndex: i,
        words: segment.words.map((w) => ({
          text: w.text,
          startSeconds: w.startSeconds,
          endSeconds: w.endSeconds,
          segmentIndex: i,
        })),
      });
      continue;
    }

    const text = segment.transcript?.trim();
    if (!text) continue;

    const chunks = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    if (chunks.length === 0) continue;

    const chunkDuration = duration / chunks.length;
    chunks.forEach((chunk, chunkIndex) => {
      const chunkStart = start + chunkIndex * chunkDuration;
      paragraphs.push({
        text: chunk,
        startSeconds: chunkStart,
        endSeconds: chunkStart + chunkDuration,
        segmentIndex: i,
        words: buildWordsForSegment(chunk, i, chunkStart, chunkDuration),
      });
    });
  }

  return paragraphs;
}

export function findActiveParagraphIndex(
  paragraphs: TimedParagraph[],
  currentTime: number,
): number {
  const idx = paragraphs.findIndex(
    (p) => currentTime >= p.startSeconds && currentTime < p.endSeconds,
  );
  return idx >= 0 ? idx : 0;
}

export function findActiveWordIndex(
  words: TimedWord[],
  currentTime: number,
): number {
  const idx = words.findIndex(
    (w) => currentTime >= w.startSeconds && currentTime < w.endSeconds,
  );
  return idx >= 0 ? idx : -1;
}
