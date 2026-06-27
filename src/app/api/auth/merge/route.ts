import { NextResponse } from "next/server";

import { mergeAnonymousProgress } from "@/lib/content/merge-anonymous-progress";
import { getContentKeyFromRequest } from "@/lib/content/request";
import { getUserIdFromRequest } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const contentKey = getContentKeyFromRequest(request);
  const userId = await getUserIdFromRequest(request);

  if (!contentKey || !userId) {
    return NextResponse.json(
      { error: "Missing content key or auth token" },
      { status: 400 },
    );
  }

  try {
    await mergeAnonymousProgress(contentKey, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to merge progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
