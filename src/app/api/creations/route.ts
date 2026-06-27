import { NextResponse, type NextRequest } from "next/server";

import { isGeminiConfigured } from "@/lib/ai/gemini-client";
import { scheduleNextStep } from "@/lib/ai/orchestrator/chain";
import { uploadCreationAsset } from "@/lib/content/assets";
import { buildCreationFromInput } from "@/lib/content/create-from-input";
import {
  createCreation,
  listCreations,
  updateCreationGeneration,
  updateCreationSetup,
} from "@/lib/content/creations";
import { resolveIdentityFromRequest } from "@/lib/content/resolve-identity";
import { getContentKeyFromRequest } from "@/lib/content/request";
import { creationInputSchema } from "@/features/creation/creation-schema";
import type { CreationInput } from "@/features/creation/types";
import {
  MAX_REFERENCE_FILES,
  validateReferenceFiles,
} from "@/features/creation/reference-files";
import {
  PlatformAccessError,
  requirePlatformAccess,
} from "@/lib/chrysty/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
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
    return NextResponse.json(creations);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load creations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function parseCreationRequest(request: Request): Promise<{
  input: CreationInput;
  files: File[];
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const setupRaw = formData.get("setup");

    if (typeof setupRaw !== "string" || setupRaw.trim().length === 0) {
      throw new Error("setup field is required");
    }

    let setupJson: unknown;
    try {
      setupJson = JSON.parse(setupRaw);
    } catch {
      throw new Error("setup must be valid JSON");
    }

    const parsed = creationInputSchema.safeParse(setupJson);
    if (!parsed.success) {
      throw new Error(JSON.stringify(parsed.error.flatten()));
    }

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (files.length > MAX_REFERENCE_FILES) {
      throw new Error(`You can upload up to ${MAX_REFERENCE_FILES} files.`);
    }

    const validationError = validateReferenceFiles(files);
    if (validationError) {
      throw new Error(validationError);
    }

    return { input: parsed.data, files };
  }

  const body = await request.json();
  const parsed = creationInputSchema.safeParse(body);

  if (!parsed.success) {
    throw new Error(JSON.stringify(parsed.error.flatten()));
  }

  return { input: parsed.data, files: [] };
}

async function startGeneration(contentKey: string, creationId: string) {
  if (!isGeminiConfigured()) {
    await updateCreationGeneration(contentKey, creationId, {
      status: "failed",
      generationProgress: 0,
      metadata: {
        version: 1,
        pipeline: {
          status: "failed",
          error: "GEMINI_API_KEY is not configured",
        },
        display: {},
      },
    });
    return;
  }

  scheduleNextStep(creationId, contentKey);
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const contentKey = getContentKeyFromRequest(request);
  if (!contentKey) {
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

  try {
    const { input, files } = await parseCreationRequest(request);
    const payload = buildCreationFromInput(input);
    let creation = await createCreation(contentKey, payload);

    if (files.length > 0) {
      const assetIds: string[] = [];

      try {
        for (const file of files) {
          const asset = await uploadCreationAsset({
            contentKey,
            creationId: creation.id,
            file,
            assetType: "source",
          });
          assetIds.push(asset.id);
        }
      } catch (uploadError) {
        await updateCreationGeneration(contentKey, creation.id, {
          status: "failed",
          generationProgress: 0,
          metadata: {
            version: 1,
            pipeline: {
              status: "failed",
              error:
                uploadError instanceof Error
                  ? uploadError.message
                  : "Reference file upload failed",
            },
            display: {},
          },
        });
        throw uploadError;
      }

      creation = await updateCreationSetup(contentKey, creation.id, {
        ...payload.setup,
        referenceFileAssetIds: assetIds,
      });
    }

    await startGeneration(contentKey, creation.id);

    return NextResponse.json(creation, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create creation";

    let status = 500;
    try {
      JSON.parse(message);
      status = 400;
    } catch {
      if (
        message.includes("upload") ||
        message.includes("files") ||
        message.includes("supported")
      ) {
        status = 400;
      }
    }

    return NextResponse.json({ error: message }, { status });
  }
}
