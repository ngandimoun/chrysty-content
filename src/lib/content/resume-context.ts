import type {
  AudioManifest,
  BookManifest,
} from "@/types/content-metadata";
import type { ResumeContext } from "@/types/consumption";

export function deriveResumeContextFromBook(
  manifest: BookManifest,
  pageIndex: number,
): ResumeContext {
  const page = manifest.pages[pageIndex];
  const sectionTitle =
    page?.blocks.find((b) => b.type === "heading")?.text ??
    `Page ${page?.pageNumber ?? pageIndex + 1}`;

  const excerpt =
    page?.blocks
      .filter((b) => b.type === "paragraph")
      .map((b) => b.text)
      .join(" ")
      .slice(0, 280) ?? "";

  return {
    sectionIndex: pageIndex,
    sectionTitle,
    excerpt,
  };
}

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function deriveResumeContextFromAudio(
  manifest: AudioManifest,
  segmentIndex: number,
  positionSeconds: number,
): ResumeContext {
  const segment = manifest.segments[segmentIndex];
  return {
    sectionIndex: segmentIndex,
    sectionTitle: segment
      ? `Segment ${segment.sequence + 1}`
      : `Chapter ${segmentIndex + 1}`,
    excerpt: `Listening at ${formatSeconds(positionSeconds)}`,
  };
}
