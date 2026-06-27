import { NextResponse } from "next/server";

import { computeUserStats } from "@/lib/content/consumption";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
import {
  assertAuthenticatedRequest,
  respondPlatformAccessError,
} from "@/lib/chrysty/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
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
    const stats = await computeUserStats(identity);
    return NextResponse.json(stats);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load profile stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
