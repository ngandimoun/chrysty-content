import { NextResponse } from "next/server";

import {
  getOrCreateProgress,
  mapProgressRowToSnapshot,
  updateProgress,
} from "@/lib/content/consumption";
import { getMappedCreationById } from "@/lib/content/creations";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { consumptionProgressPatchSchema } from "@/types/consumption";

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

  const identity = await resolveIdentityFromRequest(request);
  if (!identity) {
    return NextResponse.json(
      { error: "Missing or invalid content key" },
      { status: 400 },
    );
  }

  const { id } = await context.params;

  try {
    const creation = await getMappedCreationById(
      identity.contentKey,
      id,
      identity.userId,
    );
    if (!creation) {
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    const row = await getOrCreateProgress(identity, id);
    return NextResponse.json(mapProgressRowToSnapshot(row, creation));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load consumption";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const identity = await resolveIdentityFromRequest(request);
  if (!identity) {
    return NextResponse.json(
      { error: "Missing or invalid content key" },
      { status: 400 },
    );
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = consumptionProgressPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const creation = await getMappedCreationById(
      identity.contentKey,
      id,
      identity.userId,
    );
    if (!creation) {
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    const row = await updateProgress(identity, id, parsed.data);
    return NextResponse.json(mapProgressRowToSnapshot(row, creation));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update consumption";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
