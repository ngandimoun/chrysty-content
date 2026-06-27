import { NextResponse } from "next/server";

import { repairWavBuffer } from "@/lib/ai/audio/concat";
import { resolveAssetContentType } from "@/lib/content/asset-content-type";
import {
  downloadAssetBuffer,
  getCreationAssetById,
} from "@/lib/content/assets";
import { getContentKeyFromCoverRequest } from "@/lib/content/cover-request";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ id: string; assetId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const contentKey = getContentKeyFromCoverRequest(request);
  if (!contentKey) {
    return NextResponse.json(
      { error: "Missing or invalid content key" },
      { status: 400 },
    );
  }

  const { id, assetId } = await context.params;

  try {
    const asset = await getCreationAssetById(contentKey, id, assetId);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    let buffer = await downloadAssetBuffer(asset.storage_path);
    let contentType = resolveAssetContentType(asset);
    let cacheControl = "private, max-age=3600";

    if (contentType.startsWith("audio/") || asset.mime_type?.startsWith("audio/")) {
      buffer = repairWavBuffer(buffer, assetId);
      contentType = "audio/wav";
      cacheControl = "private, no-cache, must-revalidate";
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load asset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
