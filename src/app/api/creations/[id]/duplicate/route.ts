import { NextResponse } from "next/server";

import { getCreationById, createCreation } from "@/lib/content/creations";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
import { requireApiAuth } from "@/lib/chrysty/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { CreationInput } from "@/features/creation/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const authError = await requireApiAuth(request);
  if (authError) return authError;

  const identity = await resolveIdentityFromRequest(request);
  if (!identity) {
    return NextResponse.json(
      { error: "Missing or invalid content key" },
      { status: 400 },
    );
  }

  const { id } = await context.params;

  try {
    const source = await getCreationById(identity.contentKey, id);
    if (!source) {
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    const setup = source.setup as unknown as CreationInput;
    const copy = await createCreation(identity.contentKey, {
      title: `${source.title} (Copy)`,
      type: source.type as import("@/types/creation").CreationType,
      category: source.category as "story" | "audiobook" | "podcast",
      topic: (setup as { topic?: string }).topic,
      description: source.description ?? undefined,
      pageCount: source.pageCount ?? undefined,
      artworkGradient: "from-violet-400 via-purple-500 to-indigo-600",
      setup,
    });

    return NextResponse.json(copy);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to duplicate creation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
