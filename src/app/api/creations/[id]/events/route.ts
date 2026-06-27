import { NextResponse } from "next/server";
import { z } from "zod";

import { recordConsumptionEvents } from "@/lib/content/consumption";
import { getCreationById } from "@/lib/content/creations";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { consumptionEventInputSchema } from "@/types/consumption";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  events: z.array(consumptionEventInputSchema).min(1).max(20),
});

export async function POST(request: Request, context: RouteContext) {
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
    const creation = await getCreationById(identity.contentKey, id);
    if (!creation) {
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await recordConsumptionEvents(identity, id, parsed.data.events);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
