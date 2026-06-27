import { extractSegmentTranscript } from "@/lib/ai/prompts/podcast";
import type { AudioDirection, AudioPlan, AudioSegmentPlan } from "@/types/content-metadata";

const WORDS_PER_MINUTE = 150;
const MAX_SEGMENT_MINUTES = 3;
const MAX_WORDS_PER_SEGMENT = WORDS_PER_MINUTE * MAX_SEGMENT_MINUTES;

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function splitTranscriptIntoChunks(transcript: string): string[] {
  const lines = transcript.split("\n").filter((l) => l.trim());
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

export function resolveTtsSegments(
  audioPlan: AudioPlan,
  audioDirection: AudioDirection,
): AudioSegmentPlan[] {
  if (audioPlan.segments?.length) {
    const needsExcerpts = audioPlan.segments.some((s) => !s.transcriptExcerpt);
    if (needsExcerpts) {
      const autoSegments = buildAutoSegments(audioPlan, audioDirection);
      return audioPlan.segments.map((planSeg, index) => ({
        ...planSeg,
        transcriptExcerpt:
          planSeg.transcriptExcerpt ?? autoSegments[index]?.transcriptExcerpt,
      }));
    }
    return audioPlan.segments;
  }

  if (audioDirection.segments?.length) {
    const needsExcerpts = audioDirection.segments.some(
      (s) => !s.transcriptExcerpt,
    );
    if (needsExcerpts) {
      const autoSegments = buildAutoSegments(audioPlan, audioDirection);
      return audioDirection.segments.map((planSeg, index) => ({
        ...planSeg,
        transcriptExcerpt:
          planSeg.transcriptExcerpt ?? autoSegments[index]?.transcriptExcerpt,
      }));
    }
    return audioDirection.segments;
  }

  return buildAutoSegments(audioPlan, audioDirection);
}

export function transcriptForSegment(
  audioDirection: AudioDirection,
  segment: AudioSegmentPlan,
  checkpointTranscripts?: Record<string, string>,
): string {
  if (checkpointTranscripts?.[segment.segmentId]) {
    return checkpointTranscripts[segment.segmentId]!;
  }

  if (segment.transcriptExcerpt) {
    return segment.transcriptExcerpt;
  }

  return extractSegmentTranscript(
    audioDirection.transcript,
    segment.speakerNames,
  );
}
