import { NextResponse } from "next/server";

import { getMappedCreationById, updateCreation } from "@/lib/content/creations";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
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

    return NextResponse.json(creation);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load creation";
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
    const body = (await request.json()) as {
      isFavorite?: boolean;
      archived?: boolean;
      title?: string;
    };

    const patch: {
      is_favorite?: boolean;
      last_opened_at?: string;
      status?: "archived" | "completed";
      archived_at?: string | null;
      title?: string;
    } = {};

    if (typeof body.title === "string" && body.title.trim()) {
      patch.title = body.title.trim();
    }

    if (typeof body.isFavorite === "boolean") {
      patch.is_favorite = body.isFavorite;
      patch.last_opened_at = new Date().toISOString();
    }

    if (body.archived === true) {
      patch.status = "archived";
      patch.archived_at = new Date().toISOString();
    } else if (body.archived === false) {
      patch.status = "completed";
      patch.archived_at = null;
    }

    const creation = await updateCreation(identity.contentKey, id, patch);
    return NextResponse.json(creation);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update creation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
