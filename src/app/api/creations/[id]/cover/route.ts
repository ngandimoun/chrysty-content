import { NextResponse } from "next/server";

import {
  downloadAssetBuffer,
  getCoverAssetForCreation,
} from "@/lib/content/assets";
import { getContentKeyFromCoverRequest } from "@/lib/content/cover-request";
import { extractCreationMetadata } from "@/lib/content/mappers";
import { getCreationById } from "@/lib/content/creations";
import { requireApiAuth } from "@/lib/chrysty/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const authError = await requireApiAuth(request);
  if (authError) return authError;

  const contentKey = getContentKeyFromCoverRequest(request);
  if (!contentKey) {
    return NextResponse.json(
      { error: "Missing or invalid content key" },
      { status: 400 },
    );
  }

  const { id } = await context.params;

  try {
    const creation = await getCreationById(contentKey, id);
    if (!creation) {
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    const meta = extractCreationMetadata(creation.metadata);
    const coverAsset = await getCoverAssetForCreation(
      contentKey,
      id,
      meta.coverAssetId,
    );

    if (!coverAsset) {
      return NextResponse.json({ error: "Cover not found" }, { status: 404 });
    }

    const buffer = await downloadAssetBuffer(coverAsset.storage_path);
    const contentType = coverAsset.mime_type ?? "image/png";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load cover";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
