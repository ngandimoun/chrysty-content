import type { CreationManifestResponse } from "@/lib/content/api-client";
import type { ConsumptionSection } from "./consumption-mode";

export function resolveSections(
  manifest: CreationManifestResponse,
): ConsumptionSection[] {
  if (manifest.type === "story") {
    return manifest.manifest.pages.map((page, index) => {
      const heading = page.blocks.find((b) => b.type === "heading");
      return {
        id: String(page.pageNumber),
        index,
        title: heading?.type === "heading" ? heading.text : `Page ${page.pageNumber}`,
        pageNumber: page.pageNumber,
      };
    });
  }

  let offset = 0;
  return manifest.manifest.segments.map((segment, index) => {
    const section: ConsumptionSection = {
      id: segment.segmentId,
      index,
      title: segment.title ?? `Part ${segment.sequence + 1}`,
      startTimeSeconds: offset,
    };
    offset += segment.durationSeconds;
    return section;
  });
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateBookReadingMinutes(
  manifest: CreationManifestResponse,
): number {
  if (manifest.type !== "story") return 0;
  let words = 0;
  for (const page of manifest.manifest.pages) {
    for (const block of page.blocks) {
      if (block.type === "heading" || block.type === "paragraph") {
        words += countWords(block.text);
      }
    }
  }
  return Math.max(1, Math.ceil(words / 200));
}
