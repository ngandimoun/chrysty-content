import type { CreationGenerationMetadata } from "@/types/content-metadata";

export function asMetadata(
  value: Record<string, unknown> | CreationGenerationMetadata,
): CreationGenerationMetadata {
  return value as CreationGenerationMetadata;
}

export function mergeMetadata(
  current: Record<string, unknown> | CreationGenerationMetadata,
  patch: Partial<CreationGenerationMetadata> & {
    checkpoint?: Partial<CreationGenerationMetadata["checkpoint"]>;
  },
): CreationGenerationMetadata {
  const base = asMetadata(current);

  return {
    ...base,
    ...patch,
    pipeline: { ...base.pipeline, ...patch.pipeline },
    display: { ...base.display, ...patch.display },
    checkpoint: {
      ...(base.checkpoint ?? {}),
      ...(patch.checkpoint ?? {}),
    },
    story: patch.story
      ? {
          ...base.story,
          ...patch.story,
          format: "illustrated_book" as const,
        }
      : base.story,
    audio: patch.audio ? { ...base.audio!, ...patch.audio } : base.audio,
    audioDirection:
      "audioDirection" in patch
        ? patch.audioDirection
        : base.audioDirection,
  };
}
