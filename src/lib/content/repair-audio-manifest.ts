import {
  measurePlayableWavSeconds,
} from "@/lib/ai/audio/concat";
import { asMetadata, mergeMetadata } from "@/lib/ai/orchestrator/metadata";
import { downloadAssetBuffer } from "@/lib/content/assets";
import {
  isManifestDurationCorrupt,
  resolveAudioDurationSeconds,
} from "@/lib/content/audio-duration";
import { updateCreationGeneration } from "@/lib/content/creations";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AudioManifest } from "@/types/content-metadata";

import { CONTENT_UPLOADS_BUCKET } from "./constants";

type AssetRow = {
  id: string;
  storage_path: string;
  asset_type: string;
  metadata: unknown;
};

function roleOf(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const role = (metadata as { role?: string }).role;
  return typeof role === "string" ? role : undefined;
}

async function downloadWavForManifest(
  manifest: AudioManifest,
  assets: AssetRow[],
): Promise<Buffer | null> {
  const masterId = manifest.finalAudioAssetId;
  const master = masterId
    ? assets.find((a) => a.id === masterId)
    : undefined;

  if (master) {
    return downloadAssetBuffer(master.storage_path);
  }

  const firstSegmentId = manifest.segments[0]?.audioAssetId;
  const segment = firstSegmentId
    ? assets.find((a) => a.id === firstSegmentId)
    : undefined;

  if (segment) {
    return downloadAssetBuffer(segment.storage_path);
  }

  return null;
}

function patchManifestDurations(
  manifest: AudioManifest,
  measuredSeconds: number,
): AudioManifest {
  const segmentCount = manifest.segments.length;
  const perSegment =
    segmentCount > 0 ? measuredSeconds / segmentCount : measuredSeconds;

  return {
    ...manifest,
    actualDurationMinutes: measuredSeconds / 60,
    segments: manifest.segments.map((seg, index) => ({
      ...seg,
      durationSeconds:
        segmentCount > 1
          ? index === segmentCount - 1
            ? measuredSeconds - perSegment * (segmentCount - 1)
            : perSegment
          : measuredSeconds,
    })),
  };
}

async function persistManifestJson(
  storagePath: string,
  manifest: AudioManifest,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(CONTENT_UPLOADS_BUCKET)
    .upload(storagePath, Buffer.from(JSON.stringify(manifest, null, 2)), {
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    console.warn("[manifest-repair] failed to persist manifest JSON", error.message);
  }
}

export async function repairAudioManifestIfNeeded(input: {
  contentKey: string;
  creationId: string;
  category: string;
  manifest: AudioManifest;
  assets: AssetRow[];
  manifestStoragePath: string;
  creationMetadata: Record<string, unknown>;
}): Promise<AudioManifest> {
  const { manifest, category } = input;

  if (!isManifestDurationCorrupt(manifest, category)) {
    return manifest;
  }

  try {
    const wavBuffer = await downloadWavForManifest(manifest, input.assets);
    if (!wavBuffer) {
      return manifest;
    }

    const measuredSeconds = measurePlayableWavSeconds(
      wavBuffer,
      input.creationId,
    );
    if (measuredSeconds <= 0) {
      return manifest;
    }

    const resolvedSeconds = resolveAudioDurationSeconds({
      category,
      targetMinutes: manifest.targetDurationMinutes,
      storedActualMinutes: manifest.actualDurationMinutes,
      measuredSeconds,
    });

    if (resolvedSeconds <= 0) {
      return manifest;
    }

    const repaired = patchManifestDurations(manifest, resolvedSeconds);
    const resolvedMinutes = Math.max(1, Math.round(resolvedSeconds / 60));

    console.info("[manifest-repair] corrected audio duration", {
      creationId: input.creationId,
      previousActualMinutes: manifest.actualDurationMinutes,
      resolvedMinutes,
      resolvedSeconds,
    });

    const metadata = asMetadata(input.creationMetadata);
    await updateCreationGeneration(input.contentKey, input.creationId, {
      duration_minutes: resolvedMinutes,
      metadata: mergeMetadata(metadata, {
        audio: {
          format: manifest.format,
          targetDurationMinutes: manifest.targetDurationMinutes,
          actualDurationMinutes: resolvedSeconds / 60,
        },
      }),
    });

    void persistManifestJson(input.manifestStoragePath, repaired);

    return repaired;
  } catch (error) {
    console.warn("[manifest-repair] failed", {
      creationId: input.creationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return manifest;
  }
}
