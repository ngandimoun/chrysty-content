import { NextResponse, type NextRequest } from "next/server";

import { isGeminiConfigured } from "@/lib/ai/gemini-client";
import { asMetadata } from "@/lib/ai/orchestrator/metadata";
import {
  isInternalGenerationRequest,
  scheduleNextStep,
} from "@/lib/ai/orchestrator/chain";
import { runNextStep } from "@/lib/ai/orchestrator/run-step";
import { seedNotStartedProgress } from "@/lib/content/consumption";
import {
  getCreationById,
  updateCreationGeneration,
} from "@/lib/content/creations";
import { getContentKeyFromRequest } from "@/lib/content/request";
import {
  PlatformAccessError,
  requirePlatformAccess,
} from "@/lib/chrysty/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

  const contentKey = getContentKeyFromRequest(request);
  const internal = isInternalGenerationRequest(request);

  if (!contentKey && !internal) {
    return NextResponse.json(
      { error: "Missing or invalid content key" },
      { status: 400 },
    );
  }

  if (!internal) {
    try {
      await requirePlatformAccess(request);
    } catch (error) {
      if (error instanceof PlatformAccessError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      throw error;
    }
  }

  const { id } = await context.params;

  try {
    let resolvedContentKey = contentKey;
    if (!resolvedContentKey && internal) {
      const url = new URL(request.url);
      resolvedContentKey = url.searchParams.get("contentKey") ?? "";
    }

    if (!resolvedContentKey) {
      return NextResponse.json(
        { error: "Missing content key" },
        { status: 400 },
      );
    }

    const creation = await getCreationById(resolvedContentKey, id);
    if (!creation) {
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    if (creation.status === "completed") {
      return NextResponse.json({
        done: true,
        progress: creation.generationProgress ?? 100,
        status: "completed",
      });
    }

    let activeCreation = creation;
    if (creation.status === "failed") {
      const metadata = asMetadata(creation.metadata);
      const step = metadata.pipeline.step;
      if (step) {
        await updateCreationGeneration(resolvedContentKey, id, {
          status: "generating",
          metadata: {
            ...metadata,
            pipeline: {
              ...metadata.pipeline,
              error: undefined,
            },
          },
        });
        const refreshed = await getCreationById(resolvedContentKey, id);
        if (refreshed) {
          activeCreation = refreshed;
        }
      }
    }

    const result = await runNextStep(activeCreation);

    if (result.skipped) {
      return NextResponse.json({
        done: false,
        progress: result.progress,
        status: "generating",
        skipped: true,
      });
    }

    await updateCreationGeneration(resolvedContentKey, id, {
      metadata: result.metadata,
      generationProgress: result.progress,
      status: result.status,
      title: result.title,
      page_count: result.pageCount,
      duration_minutes: result.durationMinutes,
    });

    if (result.status === "completed") {
      await seedNotStartedProgress(resolvedContentKey, id);
    }

    if (!result.done && result.status === "generating") {
      scheduleNextStep(id, resolvedContentKey);
    }

    return NextResponse.json({
      done: result.done,
      progress: result.progress,
      status: result.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation step failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
