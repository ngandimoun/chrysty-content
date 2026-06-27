import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { AssetMetadata, CreationAssetType } from "@/types/content-metadata";

import { CONTENT_UPLOADS_BUCKET } from "./constants";

export async function uploadCreationAsset(input: {
  contentKey: string;
  creationId: string;
  file: File;
  assetType: CreationAssetType;
  metadata?: AssetMetadata;
}) {
  const buffer = Buffer.from(await input.file.arrayBuffer());
  return uploadCreationAssetBuffer({
    contentKey: input.contentKey,
    creationId: input.creationId,
    buffer,
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    assetType: input.assetType,
    metadata: input.metadata,
  });
}

export async function uploadCreationAssetBuffer(input: {
  contentKey: string;
  creationId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  assetType: CreationAssetType;
  metadata?: AssetMetadata;
}) {
  const supabase = createAdminClient();
  const safeName = input.fileName.replace(/[^\w.\-() ]+/g, "_");
  const storagePath = `${input.contentKey}/${input.creationId}/${crypto.randomUUID()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(CONTENT_UPLOADS_BUCKET)
    .upload(storagePath, input.buffer, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const insert: TablesInsert<"content_creation_assets"> = {
    creation_id: input.creationId,
    content_key: input.contentKey,
    asset_type: input.assetType,
    storage_bucket: CONTENT_UPLOADS_BUCKET,
    storage_path: storagePath,
    mime_type: input.mimeType,
    byte_size: input.buffer.byteLength,
    metadata: (input.metadata ?? {}) as TablesInsert<"content_creation_assets">["metadata"],
  };

  const { data, error } = await supabase
    .from("content_creation_assets")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAssetPublicUrl(storagePath: string): Promise<string> {
  const supabase = createAdminClient();
  const { data } = supabase.storage
    .from(CONTENT_UPLOADS_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function downloadAssetBuffer(storagePath: string): Promise<Buffer> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(CONTENT_UPLOADS_BUCKET)
    .download(storagePath);

  if (error) {
    throw new Error(error.message);
  }

  return Buffer.from(await data.arrayBuffer());
}

export type CoverAssetRow = {
  id: string;
  storage_path: string;
  mime_type: string | null;
};

export async function getCoverAssetForCreation(
  contentKey: string,
  creationId: string,
  coverAssetId?: string,
): Promise<CoverAssetRow | null> {
  const supabase = createAdminClient();

  if (coverAssetId) {
    const { data, error } = await supabase
      .from("content_creation_assets")
      .select("id, storage_path, mime_type")
      .eq("content_key", contentKey)
      .eq("creation_id", creationId)
      .eq("id", coverAssetId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return data;
    }
  }

  const { data, error } = await supabase
    .from("content_creation_assets")
    .select("id, storage_path, mime_type")
    .eq("content_key", contentKey)
    .eq("creation_id", creationId)
    .eq("asset_type", "cover")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCreationAssetById(
  contentKey: string,
  creationId: string,
  assetId: string,
): Promise<CoverAssetRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_creation_assets")
    .select("id, storage_path, mime_type, asset_type")
    .eq("content_key", contentKey)
    .eq("creation_id", creationId)
    .eq("id", assetId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export type SourceAssetRow = {
  id: string;
  storage_path: string;
  mime_type: string | null;
};

export async function getCreationAssetsByIds(
  contentKey: string,
  creationId: string,
  assetIds: string[],
): Promise<SourceAssetRow[]> {
  if (assetIds.length === 0) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_creation_assets")
    .select("id, storage_path, mime_type")
    .eq("content_key", contentKey)
    .eq("creation_id", creationId)
    .eq("asset_type", "source")
    .in("id", assetIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const byId = new Map((data ?? []).map((row) => [row.id, row as SourceAssetRow]));
  return assetIds
    .map((id) => byId.get(id))
    .filter((row): row is SourceAssetRow => row !== undefined);
}

export async function listSourceAssetsForCreation(
  contentKey: string,
  creationId: string,
): Promise<SourceAssetRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_creation_assets")
    .select("id, storage_path, mime_type")
    .eq("content_key", contentKey)
    .eq("creation_id", creationId)
    .eq("asset_type", "source")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
