import { NextResponse, type NextRequest } from "next/server";

import { createTextInteraction } from "@/lib/ai/text/interactions";
import { isGeminiConfigured } from "@/lib/ai/gemini-client";
import {
  getOrCreateProgress,
} from "@/lib/content/consumption";
import { getMappedCreationById } from "@/lib/content/creations";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
import {
  PlatformAccessError,
  requirePlatformAccess,
} from "@/lib/chrysty/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { resumeContextSchema } from "@/types/consumption";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  prompt: z.string().min(1).max(4000),
});

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
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
    await requirePlatformAccess(request);
  } catch (error) {
    if (error instanceof PlatformAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
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

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const progress = await getOrCreateProgress(identity, id);
    const resumeContext = resumeContextSchema.safeParse(
      progress.resume_context,
    ).success
      ? resumeContextSchema.parse(progress.resume_context)
      : creation.consumption?.resumeContext;

    const systemParts = [
      `You are a helpful reading/listening assistant for "${creation.title}".`,
      creation.description ? `Description: ${creation.description}` : "",
    ];

    if (resumeContext?.excerpt) {
      systemParts.push(
        `The user previously stopped at: ${resumeContext.sectionTitle ?? "a section"}.`,
        `Context excerpt: ${resumeContext.excerpt}`,
      );
    }

    const { text } = await createTextInteraction({
      userMessage: parsed.data.prompt,
      systemInstruction: systemParts.filter(Boolean).join("\n"),
      temperature: 0.7,
    });

    return NextResponse.json({ text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Assistant request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
