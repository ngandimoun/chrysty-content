import type { AudioPlan } from "@/types/content-metadata";

const WORDS_PER_MINUTE = 150;
const MAX_SEGMENT_MINUTES = 3;
const MAX_WORDS_PER_SEGMENT = WORDS_PER_MINUTE * MAX_SEGMENT_MINUTES;
const WORD_COUNT_SWAP_THRESHOLD = 120;

const DURATION_LIMITS = {
  audiobook: { min: 5, max: 20 },
  podcast: { min: 3, max: 18 },
} as const;

function maxSegmentsForDuration(targetMinutes: number): number {
  return Math.max(1, Math.ceil(targetMinutes / MAX_SEGMENT_MINUTES));
}

function inferDurationFromWordCount(wordCount: number): number {
  return Math.round(wordCount / WORDS_PER_MINUTE);
}

function looksLikeWordCountSwap(plan: AudioPlan): boolean {
  const { targetDurationMinutes, estimatedWordCount } = plan;
  if (targetDurationMinutes <= WORD_COUNT_SWAP_THRESHOLD) {
    return false;
  }

  const inferredFromTarget = inferDurationFromWordCount(targetDurationMinutes);
  const limits = DURATION_LIMITS[plan.format];
  const inferredFromWords = inferDurationFromWordCount(estimatedWordCount);

  const targetLooksLikeWords =
    inferredFromTarget >= limits.min && inferredFromTarget <= limits.max;
  const wordsLookLikeWords =
    estimatedWordCount > WORD_COUNT_SWAP_THRESHOLD &&
    inferredFromWords >= limits.min &&
    inferredFromWords <= limits.max;

  return targetLooksLikeWords && wordsLookLikeWords;
}

export function normalizeAudioPlan(
  plan: AudioPlan,
  options?: { creationId?: string },
): AudioPlan {
  const limits = DURATION_LIMITS[plan.format];
  let targetDurationMinutes = plan.targetDurationMinutes;
  let estimatedWordCount = plan.estimatedWordCount;
  const corrections: string[] = [];

  if (looksLikeWordCountSwap(plan)) {
    const corrected = inferDurationFromWordCount(estimatedWordCount);
    corrections.push(
      `targetDurationMinutes ${targetDurationMinutes} → ${corrected} (word-count swap)`,
    );
    targetDurationMinutes = corrected;
  }

  if (targetDurationMinutes > limits.max) {
    corrections.push(
      `targetDurationMinutes ${targetDurationMinutes} → ${limits.max} (clamp max)`,
    );
    targetDurationMinutes = limits.max;
  } else if (targetDurationMinutes < limits.min) {
    corrections.push(
      `targetDurationMinutes ${targetDurationMinutes} → ${limits.min} (clamp min)`,
    );
    targetDurationMinutes = limits.min;
  }

  estimatedWordCount = Math.round(targetDurationMinutes * WORDS_PER_MINUTE);

  let segments = plan.segments;
  const maxSegments = maxSegmentsForDuration(targetDurationMinutes);
  if (segments && segments.length > maxSegments) {
    corrections.push(
      `segments ${segments.length} → ${maxSegments} (cap by duration)`,
    );
    segments = segments.slice(0, maxSegments).map((seg, index) => ({
      ...seg,
      segmentId: seg.segmentId || `seg_${String(index + 1).padStart(2, "0")}`,
      estimatedDurationMinutes: Math.min(
        seg.estimatedDurationMinutes,
        MAX_SEGMENT_MINUTES,
      ),
    }));
  }

  if (segments) {
    segments = segments.map((seg) => ({
      ...seg,
      estimatedDurationMinutes: Math.min(
        seg.estimatedDurationMinutes,
        MAX_SEGMENT_MINUTES,
      ),
    }));
  }

  if (corrections.length > 0) {
    console.info("[audio-plan] normalized", {
      creationId: options?.creationId,
      format: plan.format,
      corrections,
    });
  }

  return {
    ...plan,
    targetDurationMinutes,
    estimatedWordCount,
    segments,
  };
}

export function sanitizeAudiobookTranscript(transcript: string): string {
  const whisperPattern = /\[whispers?\]/gi;
  const slowPattern = /\[very slow\]/gi;

  let result = transcript;
  let whisperCount = 0;
  result = result.replace(whisperPattern, () => {
    whisperCount += 1;
    return whisperCount <= 1 ? "[calm]" : "";
  });
  result = result.replace(slowPattern, "[thoughtful]");
  return result.replace(/\n{3,}/g, "\n\n").trim();
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function coerceTtsPrompt(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => coerceTtsPrompt(entry))
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const audioProfile = pickString(obj, ["audioProfile", "profile", "name"]);
    const scene = pickString(obj, ["scene", "theScene"]);
    const directorsNotes = pickString(obj, [
      "directorsNotes",
      "directorNotes",
      "notes",
    ]);
    const sampleContext = pickString(obj, ["sampleContext", "context"]);

    const sections: string[] = [];
    if (audioProfile) {
      sections.push(`# AUDIO PROFILE: ${audioProfile}`);
    }
    if (scene) {
      sections.push(`## THE SCENE: ${scene}`);
    }
    if (directorsNotes) {
      sections.push(`### DIRECTOR'S NOTES\n${directorsNotes}`);
    }
    if (sampleContext) {
      sections.push(`### SAMPLE CONTEXT\n${sampleContext}`);
    }

    if (sections.length > 0) {
      return sections.join("\n\n").trim();
    }

    return Object.entries(obj)
      .filter(([, entry]) => typeof entry === "string" && entry.trim())
      .map(([key, entry]) => `# ${key.toUpperCase()}\n${String(entry).trim()}`)
      .join("\n\n");
  }

  return String(value).trim();
}
