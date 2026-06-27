import { NextResponse } from "next/server";

import { listRecentActivity } from "@/lib/content/creations";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const identity = await resolveIdentityFromRequest(request);
  if (!identity) {
    return NextResponse.json(
      { error: "Missing or invalid content key" },
      { status: 400 },
    );
  }

  try {
    const activity = await listRecentActivity(identity.contentKey, identity);
    return NextResponse.json(activity);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
