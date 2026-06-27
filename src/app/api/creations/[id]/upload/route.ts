import { NextResponse } from "next/server";

import { uploadCreationAsset } from "@/lib/content/assets";
import { getContentKeyFromRequest } from "@/lib/content/request";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  assetMetadataSchema,
  CREATION_ASSET_TYPES,
  type CreationAssetType,
} from "@/types/content-metadata";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ASSET_TYPES = new Set<string>(CREATION_ASSET_TYPES);

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const contentKey = getContentKeyFromRequest(request);
  if (!contentKey) {
    return NextResponse.json(
      { error: "Missing or invalid content key" },
      { status: 400 },
    );
  }

  const { id: creationId } = await context.params;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const assetType = String(formData.get("assetType") ?? "source");
    const metadataRaw = formData.get("metadata");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!ASSET_TYPES.has(assetType)) {
      return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
    }

    let metadata;
    if (typeof metadataRaw === "string" && metadataRaw.trim().length > 0) {
      const parsed = assetMetadataSchema.safeParse(JSON.parse(metadataRaw));
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.flatten() },
          { status: 400 },
        );
      }
      metadata = parsed.data;
    }

    const asset = await uploadCreationAsset({
      contentKey,
      creationId,
      file,
      assetType: assetType as CreationAssetType,
      metadata,
    });

    return NextResponse.json({ id: asset.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
