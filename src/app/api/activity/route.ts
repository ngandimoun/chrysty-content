import { NextResponse, type NextRequest } from "next/server";

import { listRecentActivity } from "@/lib/content/creations";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
import {
  assertAuthenticatedRequest,
  respondPlatformAccessError,
} from "@/lib/chrysty/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    await assertAuthenticatedRequest(request);
  } catch (error) {
    const response = respondPlatformAccessError(error);
    if (response) return response;
    throw error;
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
