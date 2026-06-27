import type { CreationManifestResponse } from "@/lib/content/api-client";
import type { VisualTheme } from "@/types/content-metadata";
import { deriveVisualTheme } from "@/lib/content/visual-theme";

export type ConsumptionMode = "book" | "audiobook" | "podcast";

export interface ConsumptionSection {
  id: string;
  index: number;
  title: string;
  startTimeSeconds?: number;
  pageNumber?: number;
}

export function resolveConsumptionMode(
  manifest: CreationManifestResponse,
): ConsumptionMode {
  if (manifest.type === "story") return "book";
  if (manifest.type === "podcast") return "podcast";
  return "audiobook";
}

export function resolveVisualTheme(
  manifest: CreationManifestResponse,
  topic?: string,
): VisualTheme {
  const fromManifest = manifest.manifest.visualTheme;
  if (fromManifest) return fromManifest;

  return deriveVisualTheme({
    topic,
    category: manifest.type === "story" ? "story" : manifest.type,
    format: manifest.type === "story" ? undefined : manifest.manifest.format,
    audience:
      manifest.type === "story" ? manifest.manifest.audience : undefined,
  });
}

export function isAudioMode(mode: ConsumptionMode): boolean {
  return mode === "audiobook" || mode === "podcast";
}
