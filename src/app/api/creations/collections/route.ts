import { NextResponse } from "next/server";

import { buildCollections } from "@/lib/content/consumption";
import { listCreations } from "@/lib/content/creations";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { CollectionShelfId } from "@/types/consumption";

const SHELVES: CollectionShelfId[] = [
  "continue_reading",
  "continue_listening",
  "unread",
  "completed",
  "recent",
  "favorites",
  "archived",
];

export async function GET(request: Request) {
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

  try {
    const creations = await listCreations(
      identity.contentKey,
      identity.userId,
    );
    const shelfParam = new URL(request.url).searchParams.get("shelf");

    if (shelfParam) {
      const shelf = shelfParam as CollectionShelfId;
      if (!SHELVES.includes(shelf)) {
        return NextResponse.json({ error: "Invalid shelf" }, { status: 400 });
      }
      return NextResponse.json(buildCollections(creations, shelf));
    }

    const collections = Object.fromEntries(
      SHELVES.map((shelf) => [shelf, buildCollections(creations, shelf)]),
    );

    return NextResponse.json(collections);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load collections";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
