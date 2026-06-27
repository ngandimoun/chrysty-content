import type { Creation } from "@/types/creation";

import {
  resolveAudioDurationMinutes,
  type ResolveAudioDurationInput,
} from "./audio-duration";

export function getEffectiveDurationMinutes(
  creation: Pick<
    Creation,
    | "durationMinutes"
    | "actualDurationMinutes"
    | "targetDurationMinutes"
    | "category"
  >,
): number | undefined {
  return resolveAudioDurationMinutes({
    category: creation.category,
    targetMinutes: creation.targetDurationMinutes,
    storedActualMinutes: creation.actualDurationMinutes,
    storedDurationMinutes: creation.durationMinutes,
  });
}

export function getEffectiveDurationMinutesFromInput(
  input: ResolveAudioDurationInput,
): number | undefined {
  return resolveAudioDurationMinutes(input);
}
