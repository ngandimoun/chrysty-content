import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dedupeSegmentAssets,
  MASTER_WAV_UPLOAD_MAX_BYTES,
  shouldSkipMasterUpload,
} from "@/lib/ai/audio/compose-helpers";
import type { SegmentAssetRecord } from "@/types/content-metadata";

function segment(
  segmentId: string,
  assetId: string,
): SegmentAssetRecord {
  return {
    segmentId,
    assetId,
    storagePath: `path/${segmentId}.wav`,
    durationSeconds: 120,
  };
}

describe("dedupeSegmentAssets", () => {
  it("keeps the latest entry per segmentId", () => {
    const first = segment("seg_01", "11111111-1111-4111-8111-111111111111");
    const second = {
      ...segment("seg_01", "22222222-2222-4222-8222-222222222222"),
      durationSeconds: 180,
    };
    const other = segment("seg_02", "33333333-3333-4333-8333-333333333333");

    const deduped = dedupeSegmentAssets([first, other, second]);

    assert.equal(deduped.length, 2);
    assert.equal(
      deduped.find((entry) => entry.segmentId === "seg_01")?.assetId,
      second.assetId,
    );
    assert.equal(
      deduped.find((entry) => entry.segmentId === "seg_02")?.assetId,
      other.assetId,
    );
  });

  it("returns empty array unchanged", () => {
    assert.deepEqual(dedupeSegmentAssets([]), []);
  });
});

describe("shouldSkipMasterUpload", () => {
  it("allows uploads at or below the limit", () => {
    assert.equal(shouldSkipMasterUpload(MASTER_WAV_UPLOAD_MAX_BYTES), false);
    assert.equal(shouldSkipMasterUpload(MASTER_WAV_UPLOAD_MAX_BYTES - 1), false);
  });

  it("skips uploads above the limit", () => {
    assert.equal(shouldSkipMasterUpload(MASTER_WAV_UPLOAD_MAX_BYTES + 1), true);
    assert.equal(shouldSkipMasterUpload(120 * 1024 * 1024), true);
  });
});
