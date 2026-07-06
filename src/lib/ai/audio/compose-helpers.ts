import type { SegmentAssetRecord } from "@/types/content-metadata";

/** Stay below Supabase bucket limit (100–200 MB) with headroom for concat inflation. */
export const MASTER_WAV_UPLOAD_MAX_BYTES = 90 * 1024 * 1024;

export function dedupeSegmentAssets(
  segmentAssets: SegmentAssetRecord[],
): SegmentAssetRecord[] {
  const bySegmentId = new Map<string, SegmentAssetRecord>();
  for (const entry of segmentAssets) {
    bySegmentId.set(entry.segmentId, entry);
  }
  return [...bySegmentId.values()];
}

export function shouldSkipMasterUpload(byteLength: number): boolean {
  return byteLength > MASTER_WAV_UPLOAD_MAX_BYTES;
}
