import type { CreationCategory } from "@/types/creation";

export const AUDIO_DURATION_MAX: Record<string, number> = {
  audiobook: 20,
  podcast: 18,
};

/** Ignore near-zero browser metadata from corrupt WAV headers. */
export const MIN_TRUSTED_MEASURED_SECONDS = 1;

export interface ResolveAudioDurationInput {
  category: CreationCategory | string;
  targetMinutes?: number;
  storedActualMinutes?: number;
  storedDurationMinutes?: number;
  measuredSeconds?: number;
}

function categoryMaxMinutes(category: string): number | undefined {
  return AUDIO_DURATION_MAX[category];
}

export function isInflatedAudioDuration(
  minutes: number,
  category: string,
): boolean {
  const max = categoryMaxMinutes(category);
  return max != null && minutes > max * 3;
}

function isSaneDurationSeconds(
  seconds: number,
  category: string,
): boolean {
  if (seconds <= 0) return false;
  const max = categoryMaxMinutes(category);
  if (max == null) return true;
  return seconds <= max * 60 * 3;
}

function isSaneDurationMinutes(
  minutes: number,
  category: string,
): boolean {
  if (minutes <= 0) return false;
  return !isInflatedAudioDuration(minutes, category);
}

/** Single source of truth for playable audio length (seconds). */
export function resolveAudioDurationSeconds(
  input: ResolveAudioDurationInput,
): number {
  const { category, targetMinutes, storedActualMinutes, storedDurationMinutes } =
    input;

  if (
    input.measuredSeconds != null &&
    input.measuredSeconds >= MIN_TRUSTED_MEASURED_SECONDS &&
    isSaneDurationSeconds(input.measuredSeconds, category)
  ) {
    return input.measuredSeconds;
  }

  const storedCandidates: number[] = [];

  if (
    storedActualMinutes != null &&
    storedActualMinutes > 0 &&
    isSaneDurationMinutes(storedActualMinutes, category)
  ) {
    storedCandidates.push(storedActualMinutes * 60);
  }

  if (
    storedDurationMinutes != null &&
    storedDurationMinutes > 0 &&
    isSaneDurationMinutes(storedDurationMinutes, category)
  ) {
    storedCandidates.push(storedDurationMinutes * 60);
  }

  if (storedCandidates.length > 0) {
    return Math.min(...storedCandidates);
  }

  if (targetMinutes != null && targetMinutes > 0) {
    return targetMinutes * 60;
  }

  return 0;
}

export function resolveAudioDurationMinutes(
  input: ResolveAudioDurationInput,
): number | undefined {
  const seconds = resolveAudioDurationSeconds(input);
  if (seconds <= 0) return undefined;
  return Math.max(1, Math.round(seconds / 60));
}

export function isManifestDurationCorrupt(
  manifest: {
    targetDurationMinutes: number;
    actualDurationMinutes: number;
    segments: { durationSeconds: number }[];
  },
  category: string,
): boolean {
  if (isInflatedAudioDuration(manifest.actualDurationMinutes, category)) {
    return true;
  }

  const plannedSeconds = manifest.targetDurationMinutes * 60;
  const segmentTotal = manifest.segments.reduce(
    (sum, s) => sum + s.durationSeconds,
    0,
  );

  if (
    plannedSeconds > 0 &&
    segmentTotal > plannedSeconds * 3
  ) {
    return true;
  }

  return false;
}
