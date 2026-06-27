import type { AudioManifest } from "@/types/content-metadata";

export function audioManifestHasTranscript(manifest: AudioManifest): boolean {
  if (manifest.transcript?.trim()) return true;
  return manifest.segments.some((segment) => Boolean(segment.transcript?.trim()));
}
