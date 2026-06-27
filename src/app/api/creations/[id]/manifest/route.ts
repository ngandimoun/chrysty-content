import { NextResponse } from "next/server";

import { loadCreationManifest } from "@/lib/content/manifests";
import { getContentKeyFromRequest } from "@/lib/content/request";
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

  const contentKey = getContentKeyFromRequest(request);
  if (!contentKey) {
    return NextResponse.json(
      { error: "Missing or invalid content key" },
      { status: 400 },
    );
  }

  const { id } = await context.params;

  try {
    const payload = await loadCreationManifest(contentKey, id);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load manifest";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
