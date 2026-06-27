export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isModelUnavailableError(error: unknown): boolean {
  const message = errorMessage(error);
  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("unavailable") ||
    message.includes("UNAVAILABLE")
  );
}

export function isPolicyBlockedError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("policy reason") ||
    message.includes("prohibited_content") ||
    message.includes("prohibited content") ||
    message.includes("safety") ||
    message.includes("blocked") ||
    (message.includes("400") &&
      (message.includes("request blocked") ||
        message.includes("content filter") ||
        message.includes("harm")))
  );
}

export function formatPipelineError(raw: string, step?: string): string {
  if (isPolicyBlockedError(raw)) {
    if (step === "audio_tts") {
      return "Audio synthesis was blocked by content safety filters. Try a softer topic, reduce dramatic tags, or edit your topic and retry.";
    }
    if (step === "audio_cover" || step === "story_cover" || step === "story_illustrate") {
      return "Cover or illustration generation was blocked by content safety filters. Try adjusting your topic or reference material and retry.";
    }
    return "Content was blocked by safety filters. Try adjusting your topic or reference material and retry.";
  }

  if (
    raw.includes("no image data") &&
    (step === "audio_cover" || step === "story_cover" || step === "story_illustrate")
  ) {
    return "Image generation did not return artwork. The creation may continue without a cover, or you can retry generation.";
  }

  return raw;
}
