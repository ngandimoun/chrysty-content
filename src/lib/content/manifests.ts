import { createAdminClient } from "@/lib/supabase/admin";
import {
  audioManifestSchema,
  bookManifestSchema,
  type AudioManifest,
  type BookManifest,
} from "@/types/content-metadata";

import { CONTENT_UPLOADS_BUCKET } from "./constants";
import { buildCreationAssetPath } from "./cover-url";
import { getCreationById } from "./creations";
import { repairAudioManifestIfNeeded } from "./repair-audio-manifest";

type AssetRow = {
  id: string;
  storage_path: string;
  asset_type: string;
  metadata: unknown;
};

export type ManifestPayload =
  | {
      type: "story";
      manifest: BookManifest;
      assets: Record<string, string>;
    }
  | {
      type: "audiobook" | "podcast";
      manifest: AudioManifest;
      assets: Record<string, string>;
    };

async function listCreationAssets(
  contentKey: string,
  creationId: string,
): Promise<AssetRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_creation_assets")
    .select("id, storage_path, asset_type, metadata")
    .eq("content_key", contentKey)
    .eq("creation_id", creationId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AssetRow[];
}

function roleOf(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const role = (metadata as { role?: string }).role;
  return typeof role === "string" ? role : undefined;
}

function resolveAssetUrls(
  assets: AssetRow[],
  contentKey: string,
  creationId: string,
): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const asset of assets) {
    urls[asset.id] = buildCreationAssetPath(creationId, asset.id, contentKey);
  }
  return urls;
}

export async function loadCreationManifest(
  contentKey: string,
  creationId: string,
): Promise<ManifestPayload> {
  const creation = await getCreationById(contentKey, creationId);
  if (!creation) {
    throw new Error("Creation not found");
  }

  const assets = await listCreationAssets(contentKey, creationId);
  const assetUrls = resolveAssetUrls(assets, contentKey, creationId);

  if (creation.category === "story") {
    const manifestAsset = assets.find(
      (a) => a.asset_type === "script" && roleOf(a.metadata) === "book_manifest",
    );
    if (!manifestAsset) {
      throw new Error("Book manifest not found");
    }

    const supabase = createAdminClient();
    const { data: file, error } = await supabase.storage
      .from(CONTENT_UPLOADS_BUCKET)
      .download(manifestAsset.storage_path);

    if (error) {
      throw new Error(error.message);
    }

    const manifest = bookManifestSchema.parse(
      JSON.parse(await file.text()),
    );

    return { type: "story", manifest, assets: assetUrls };
  }

  const manifestAsset = assets.find(
    (a) => a.asset_type === "script" && roleOf(a.metadata) === "audio_manifest",
  );
  if (!manifestAsset) {
    throw new Error("Audio manifest not found");
  }

  const supabase = createAdminClient();
  const { data: file, error } = await supabase.storage
    .from(CONTENT_UPLOADS_BUCKET)
    .download(manifestAsset.storage_path);

  if (error) {
    throw new Error(error.message);
  }

  const parsed = audioManifestSchema.parse(JSON.parse(await file.text()));

  const manifest = await repairAudioManifestIfNeeded({
    contentKey,
    creationId,
    category: creation.category,
    manifest: parsed,
    assets,
    manifestStoragePath: manifestAsset.storage_path,
    creationMetadata: creation.metadata as Record<string, unknown>,
  });

  return {
    type: creation.category === "audiobook" ? "audiobook" : "podcast",
    manifest,
    assets: assetUrls,
  };
}
