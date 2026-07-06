import {
  measurePlayableWavSeconds,
  rewrapPcmAsWav,
  EXPECTED_WAV,
} from "@/lib/ai/audio/concat";
import { encodeWavBufferToMp3 } from "@/lib/ai/audio/encode-mp3";
import { asMetadata, mergeMetadata } from "@/lib/ai/orchestrator/metadata";
import {
  downloadAssetBuffer,
  uploadCreationAssetBuffer,
} from "@/lib/content/assets";
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
  mime_type: string | null;
  metadata: unknown;
};

function roleOf(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const role = (metadata as { role?: string }).role;
  return typeof role === "string" ? role : undefined;
}

function isWavAsset(asset: AssetRow): boolean {
  return (
    asset.mime_type?.includes("wav") === true ||
    asset.storage_path.toLowerCase().endsWith(".wav")
  );
}

function isMp3Asset(asset: AssetRow): boolean {
  return (
    asset.mime_type?.includes("mpeg") === true ||
    asset.storage_path.toLowerCase().endsWith(".mp3")
  );
}

function findMp3NarrationAsset(assets: AssetRow[]): AssetRow | undefined {
  return assets.find(
    (asset) =>
      asset.asset_type === "audio" &&
      roleOf(asset.metadata) === "narration" &&
      isMp3Asset(asset),
  );
}

function findAssetById(
  assets: AssetRow[],
  assetId: string | undefined,
): AssetRow | undefined {
  if (!assetId) return undefined;
  return assets.find((asset) => asset.id === assetId);
}

async function downloadWavForManifest(
  manifest: AudioManifest,
  assets: AssetRow[],
): Promise<Buffer | null> {
  const masterId = manifest.finalAudioAssetId;
  const master = findAssetById(assets, masterId);

  if (master && isWavAsset(master)) {
    return downloadAssetBuffer(master.storage_path);
  }

  const mp3Narration = findMp3NarrationAsset(assets);
  if (mp3Narration) {
    return null;
  }

  const firstSegmentId = manifest.segments[0]?.audioAssetId;
  const segment = findAssetById(assets, firstSegmentId);

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

async function ensureMp3PlaybackAsset(input: {
  contentKey: string;
  creationId: string;
  manifest: AudioManifest;
  assets: AssetRow[];
  manifestStoragePath: string;
}): Promise<AudioManifest> {
  const existingMp3 = findMp3NarrationAsset(input.assets);
  if (existingMp3) {
    if (input.manifest.finalAudioAssetId === existingMp3.id) {
      return input.manifest;
    }

    const updated = {
      ...input.manifest,
      finalAudioAssetId: existingMp3.id,
    };
    void persistManifestJson(input.manifestStoragePath, updated);
    return updated;
  }

  const playbackAsset = findAssetById(
    input.assets,
    input.manifest.finalAudioAssetId,
  );

  if (playbackAsset && isMp3Asset(playbackAsset)) {
    return input.manifest;
  }

  let wavBuffer: Buffer | null = null;

  if (playbackAsset && isWavAsset(playbackAsset)) {
    wavBuffer = await downloadAssetBuffer(playbackAsset.storage_path);
  } else {
    wavBuffer = await downloadWavForManifest(input.manifest, input.assets);
  }

  if (!wavBuffer) {
    return input.manifest;
  }

  try {
    const mp3Buffer = encodeWavBufferToMp3(wavBuffer, input.creationId);
    const durationSeconds = measurePlayableWavSeconds(
      wavBuffer,
      input.creationId,
    );

    const mp3Asset = await uploadCreationAssetBuffer({
      contentKey: input.contentKey,
      creationId: input.creationId,
      buffer: mp3Buffer,
      fileName: "master.mp3",
      mimeType: "audio/mpeg",
      assetType: "audio",
      metadata: {
        role: "narration",
        altText: `Full audio for ${input.manifest.title}`,
        durationSeconds,
        status: "ready",
      },
    });

    const updated = {
      ...input.manifest,
      finalAudioAssetId: mp3Asset.id,
    };

    console.info("[manifest-repair] backfilled MP3 playback asset", {
      creationId: input.creationId,
      mp3AssetId: mp3Asset.id,
      byteSize: mp3Buffer.byteLength,
    });

    void persistManifestJson(input.manifestStoragePath, updated);
    return updated;
  } catch (error) {
    console.warn("[manifest-repair] MP3 backfill failed", {
      creationId: input.creationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return input.manifest;
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
  let manifest = await ensureMp3PlaybackAsset(input);
  const { category } = input;

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
