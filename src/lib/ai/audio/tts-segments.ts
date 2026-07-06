import type { AudioDirection, AudioPlan, AudioSegmentPlan } from "@/types/content-metadata";

export const WORDS_PER_MINUTE = 150;
export const MAX_SEGMENT_MINUTES = 3;
export const MAX_WORDS_PER_SEGMENT = WORDS_PER_MINUTE * MAX_SEGMENT_MINUTES;
/** Guardrail: reject segment text larger than ~3.3 minutes of speech. */
export const TTS_SEGMENT_WORD_GUARD = 500;

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function transcriptLines(transcript: string): string[] {
  return transcript.split("\n").filter((line) => line.trim());
}

function excerptBySegmentId(
  segments: AudioSegmentPlan[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const segment of segments ?? []) {
    const excerpt = segment.transcriptExcerpt?.trim();
    if (excerpt) {
      map.set(segment.segmentId, excerpt);
    }
  }
  return map;
}

/** Split transcript lines into N non-overlapping slices (one per plan segment). */
export function splitTranscriptAcrossSegments(
  transcript: string,
  segmentCount: number,
): string[] {
  if (segmentCount <= 0) {
    return [];
  }

  const lines = transcriptLines(transcript);
  if (lines.length === 0) {
    return segmentCount === 1 ? [transcript] : Array(segmentCount).fill(transcript);
  }

  if (segmentCount === 1) {
    return [lines.join("\n")];
  }

  const slices: string[] = [];
  let lineIndex = 0;

  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
    const remainingSegments = segmentCount - segmentIndex;
    const remainingLines = lines.length - lineIndex;
    const lineCount = Math.max(1, Math.ceil(remainingLines / remainingSegments));
    const chunk = lines.slice(lineIndex, lineIndex + lineCount);
    lineIndex += chunk.length;
    slices.push(chunk.join("\n"));
  }

  return slices;
}

function splitTranscriptIntoChunks(transcript: string): string[] {
  const lines = transcriptLines(transcript);
  if (lines.length === 0) {
    return [transcript];
  }

  const chunks: string[] = [];
  let currentLines: string[] = [];
  let currentWords = 0;

  for (const line of lines) {
    const lineWords = countWords(line);
    if (
      currentLines.length > 0 &&
      currentWords + lineWords > MAX_WORDS_PER_SEGMENT
    ) {
      chunks.push(currentLines.join("\n"));
      currentLines = [line];
      currentWords = lineWords;
    } else {
      currentLines.push(line);
      currentWords += lineWords;
    }
  }

  if (currentLines.length > 0) {
    chunks.push(currentLines.join("\n"));
  }

  return chunks.length > 0 ? chunks : [transcript];
}

function buildAutoSegments(
  audioPlan: AudioPlan,
  audioDirection: AudioDirection,
): AudioSegmentPlan[] {
  const speakerNames = audioDirection.speakers.map((s) => s.name).slice(0, 2);
  const chunks = splitTranscriptIntoChunks(audioDirection.transcript);

  if (chunks.length === 1) {
    return [
      {
        segmentId: "seg_01",
        speakerNames,
        estimatedDurationMinutes: Math.min(
          audioPlan.targetDurationMinutes,
          MAX_SEGMENT_MINUTES,
        ),
        transcriptExcerpt: chunks[0],
      },
    ];
  }

  return chunks.map((chunk, index) => ({
    segmentId: `seg_${String(index + 1).padStart(2, "0")}`,
    speakerNames,
    estimatedDurationMinutes: Math.min(
      countWords(chunk) / WORDS_PER_MINUTE,
      MAX_SEGMENT_MINUTES,
    ),
    transcriptExcerpt: chunk,
    summary: `Narration segment ${index + 1} of ${chunks.length}`,
  }));
}

function structuralSegments(
  audioPlan: AudioPlan,
  audioDirection: AudioDirection,
): AudioSegmentPlan[] {
  if (audioPlan.segments?.length) {
    return audioPlan.segments;
  }
  if (audioDirection.segments?.length) {
    return audioDirection.segments;
  }
  return buildAutoSegments(audioPlan, audioDirection);
}

function resolveExcerptForSegment(input: {
  segment: AudioSegmentPlan;
  segmentIndex: number;
  totalSegments: number;
  directionExcerpts: Map<string, string>;
  proportionalSlices: string[];
}): string {
  const fromSegment = input.segment.transcriptExcerpt?.trim();
  if (fromSegment) {
    return fromSegment;
  }

  const fromDirection = input.directionExcerpts.get(input.segment.segmentId);
  if (fromDirection) {
    return fromDirection;
  }

  const fromSlice = input.proportionalSlices[input.segmentIndex];
  if (fromSlice?.trim()) {
    return fromSlice.trim();
  }

  return "";
}

export function resolveTtsSegments(
  audioPlan: AudioPlan,
  audioDirection: AudioDirection,
): AudioSegmentPlan[] {
  const structural = structuralSegments(audioPlan, audioDirection);

  if (structural.length === 0) {
    return buildAutoSegments(audioPlan, audioDirection);
  }

  const directionExcerpts = excerptBySegmentId(audioDirection.segments);
  const planExcerpts = excerptBySegmentId(audioPlan.segments);
  for (const [segmentId, excerpt] of planExcerpts) {
    if (!directionExcerpts.has(segmentId)) {
      directionExcerpts.set(segmentId, excerpt);
    }
  }

  const proportionalSlices = splitTranscriptAcrossSegments(
    audioDirection.transcript,
    structural.length,
  );

  return structural.map((segment, index) => {
    const transcriptExcerpt = resolveExcerptForSegment({
      segment,
      segmentIndex: index,
      totalSegments: structural.length,
      directionExcerpts,
      proportionalSlices,
    });

    return {
      ...segment,
      ...(transcriptExcerpt ? { transcriptExcerpt } : {}),
    };
  });
}

/** Stable segmentId → transcript map for TTS checkpoints. */
export function buildSegmentTranscriptMap(
  audioPlan: AudioPlan,
  audioDirection: AudioDirection,
): Record<string, string> {
  const segments = resolveTtsSegments(audioPlan, audioDirection);
  const proportionalSlices = splitTranscriptAcrossSegments(
    audioDirection.transcript,
    segments.length,
  );
  const map: Record<string, string> = {};

  segments.forEach((segment, index) => {
    map[segment.segmentId] = transcriptForSegment(
      audioDirection,
      segment,
      undefined,
      {
        totalSegments: segments.length,
        segmentIndex: index,
        proportionalSlices,
      },
    );
  });

  return map;
}

export function transcriptForSegment(
  audioDirection: AudioDirection,
  segment: AudioSegmentPlan,
  checkpointTranscripts?: Record<string, string>,
  options?: {
    totalSegments?: number;
    segmentIndex?: number;
    proportionalSlices?: string[];
  },
): string {
  if (checkpointTranscripts?.[segment.segmentId]?.trim()) {
    return checkpointTranscripts[segment.segmentId]!.trim();
  }

  if (segment.transcriptExcerpt?.trim()) {
    return segment.transcriptExcerpt.trim();
  }

  const totalSegments = options?.totalSegments ?? 1;
  const segmentIndex = options?.segmentIndex ?? 0;
  const slices =
    options?.proportionalSlices ??
    splitTranscriptAcrossSegments(audioDirection.transcript, totalSegments);

  if (totalSegments > 1) {
    const slice = slices[segmentIndex]?.trim();
    if (slice) {
      return slice;
    }
  }

  return audioDirection.transcript.trim();
}

/** Clamp oversized segment text before TTS when multiple segments exist. */
export function guardSegmentTranscript(input: {
  segmentTranscript: string;
  segmentId: string;
  segmentIndex: number;
  totalSegments: number;
  fullTranscript: string;
  creationId?: string;
}): string {
  const words = countWords(input.segmentTranscript);
  const fullWords = countWords(input.fullTranscript);

  if (input.totalSegments > 1 && fullWords > 0 && words >= fullWords * 0.9) {
    console.warn("[audio-tts] segment transcript looks like full script; slicing", {
      creationId: input.creationId,
      segmentId: input.segmentId,
      segmentIndex: input.segmentIndex,
      wordCount: words,
      fullWordCount: fullWords,
    });
    const slices = splitTranscriptAcrossSegments(
      input.fullTranscript,
      input.totalSegments,
    );
    const slice = slices[input.segmentIndex]?.trim();
    if (slice) {
      return slice;
    }
  }

  if (input.totalSegments <= 1 || words <= TTS_SEGMENT_WORD_GUARD) {
    return input.segmentTranscript;
  }

  if (words > TTS_SEGMENT_WORD_GUARD) {
    console.warn("[audio-tts] segment transcript exceeds word guard; slicing", {
      creationId: input.creationId,
      segmentId: input.segmentId,
      wordCount: words,
    });
    const slices = splitTranscriptAcrossSegments(
      input.fullTranscript,
      input.totalSegments,
    );
    const slice = slices[input.segmentIndex]?.trim();
    if (slice) {
      return slice;
    }
  }

  return input.segmentTranscript;
}

export function countTranscriptWords(text: string): number {
  return countWords(text);
}
