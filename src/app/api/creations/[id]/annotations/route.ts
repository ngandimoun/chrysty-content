import { NextResponse } from "next/server";

import {
  createAnnotation,
  deleteAnnotation,
  listAnnotations,
} from "@/lib/content/consumption";
import { getCreationById } from "@/lib/content/creations";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { annotationInputSchema } from "@/types/consumption";

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
    const creation = await getCreationById(identity.contentKey, id);
    if (!creation) {
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    const annotations = await listAnnotations(identity, id);
    return NextResponse.json(annotations);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list annotations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const parsed = annotationInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const annotation = await createAnnotation(identity, id, parsed.data);
    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create annotation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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
  const annotationId = new URL(request.url).searchParams.get("annotationId");

  if (!annotationId) {
    return NextResponse.json(
      { error: "annotationId query param required" },
      { status: 400 },
    );
  }

  try {
    await deleteAnnotation(identity, id, annotationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete annotation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
