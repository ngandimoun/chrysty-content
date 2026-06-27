import { GEMINI_VOICE_CATALOG } from "@/types/content-metadata";

export function jsonOutputRules(): string {
  return `Respond with valid JSON only. No markdown fences, no commentary outside the JSON object.`;
}

export function languageInstruction(language: string): string {
  return `Target language (BCP-47): ${language}. Write all story/script text in this language. Use English audio performance tags like [whispers] even when the script language is not English.`;
}

export function voiceCatalogForPrompt(): string {
  return GEMINI_VOICE_CATALOG.map((v) => `${v.id} (${v.style})`).join(", ");
}

export function resolveSetupLabel(
  value: string,
  custom?: string,
): string {
  if (value === "custom" && custom?.trim()) {
    return custom.trim();
  }
  return value;
}

export function storyPageCount(setup: Record<string, unknown>): number {
  const length = String(setup.length ?? "10");
  if (length === "custom") {
    const custom = Number(setup.lengthCustom);
    return Number.isFinite(custom) ? Math.min(15, Math.max(1, custom)) : 10;
  }
  return Number(length) || 10;
}

export function generationDateIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function generationDateContext(now = new Date()): string {
  const iso = generationDateIso(now);
  return `Today is ${iso}. Treat all news and "latest" facts as of this date.`;
}

export function referenceContextBlock(context?: string): string {
  if (!context?.trim()) {
    return "";
  }

  return `\n\nReference material extracted from user-uploaded documents:\n${context.trim()}\n\nHonor this material alongside the user's form inputs. Do not invent facts that contradict the references.`;
}

export function webResearchContextBlock(
  context?: string,
  asOfDate?: string,
): string {
  if (!context?.trim()) {
    return "";
  }

  const asOf = asOfDate ?? "generation time";
  return `\n\nLatest web research (as of ${asOf} — prefer over stale training data):\n${context.trim()}\n\nUse recent facts accurately in the episode. Do not invent events or statistics not supported by this research or user references.`;
}
