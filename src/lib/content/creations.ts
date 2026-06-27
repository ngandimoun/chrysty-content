import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import type { CreationGenerationMetadata } from "@/types/content-metadata";
import { createInitialMetadata } from "@/types/content-metadata";

import { fetchProgressForCreations } from "./consumption";
import type { CreationInsertPayload } from "./create-from-input";
import {
  mapActivityRow,
  mapCreationRow,
  mapCreationRowForClient,
  type ContentCreationRow,
} from "./mappers";
import type { ProgressIdentity } from "./progress-identity";
import { ensureContentWorkspace } from "./workspace";

export interface CreationRecord {
  id: string;
  contentKey: string;
  title: string;
  category: string;
  type: string;
  status: string;
  generationProgress: number | null;
  setup: Record<string, unknown>;
  metadata: CreationGenerationMetadata | Record<string, unknown>;
  pageCount: number | null;
  durationMinutes: number | null;
  description: string | null;
}

function toIdentity(contentKey: string, userId?: string): ProgressIdentity {
  return { contentKey, userId };
}

export async function listCreations(
  contentKey: string,
  userId?: string,
) {
  await ensureContentWorkspace(contentKey);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_creations")
    .select("*")
    .eq("content_key", contentKey)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const progressMap = await fetchProgressForCreations(
    toIdentity(contentKey, userId),
    rows.map((r) => r.id),
  );

  return rows.map((row) =>
    mapCreationRowForClient(row, contentKey, progressMap.get(row.id)),
  );
}

export async function getMappedCreationById(
  contentKey: string,
  creationId: string,
  userId?: string,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_creations")
    .select("*")
    .eq("content_key", contentKey)
    .eq("id", creationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const progressMap = await fetchProgressForCreations(
    toIdentity(contentKey, userId),
    [creationId],
  );

  return mapCreationRowForClient(
    data,
    contentKey,
    progressMap.get(creationId),
  );
}

export async function getCreationById(
  contentKey: string,
  creationId: string,
): Promise<CreationRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_creations")
    .select("*")
    .eq("content_key", contentKey)
    .eq("id", creationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapCreationRecord(data);
}

function mapCreationRecord(row: ContentCreationRow): CreationRecord {
  return {
    id: row.id,
    contentKey: row.content_key,
    title: row.title,
    category: row.category,
    type: row.type,
    status: row.status,
    generationProgress: row.generation_progress,
    setup: (row.setup ?? {}) as Record<string, unknown>,
    metadata: (row.metadata ?? {}) as CreationGenerationMetadata,
    pageCount: row.page_count,
    durationMinutes: row.duration_minutes,
    description: row.description,
  };
}

export async function createCreation(
  contentKey: string,
  payload: CreationInsertPayload,
) {
  const workspace = await ensureContentWorkspace(contentKey);
  const supabase = createAdminClient();

  const insert: TablesInsert<"content_creations"> = {
    workspace_id: workspace.id,
    content_key: contentKey,
    title: payload.title,
    type: payload.type,
    category: payload.category,
    content_subtype: payload.contentSubtype ?? null,
    status: "generating",
    topic: payload.topic ?? null,
    description: payload.description ?? null,
    page_count: payload.pageCount ?? null,
    artwork_gradient: payload.artworkGradient,
    generation_progress: 0,
    setup: payload.setup as unknown as TablesInsert<"content_creations">["setup"],
    metadata: createInitialMetadata() as unknown as TablesInsert<"content_creations">["metadata"],
  };

  const { data, error } = await supabase
    .from("content_creations")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapCreationRow(data);
}

export async function updateCreation(
  contentKey: string,
  creationId: string,
  patch: Partial<
    Pick<
      ContentCreationRow,
      "is_favorite" | "last_opened_at" | "status" | "archived_at" | "title"
    >
  >,
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_creations")
    .update(patch)
    .eq("content_key", contentKey)
    .eq("id", creationId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Creation not found");
  }

  return mapCreationRowForClient(data, contentKey);
}

export interface CreationGenerationPatch {
  metadata?: CreationGenerationMetadata | Record<string, unknown>;
  generationProgress?: number;
  status?: ContentCreationRow["status"];
  page_count?: number | null;
  duration_minutes?: number | null;
  title?: string;
  description?: string | null;
}

export async function updateCreationGeneration(
  contentKey: string,
  creationId: string,
  patch: CreationGenerationPatch,
) {
  const supabase = createAdminClient();

  const update: TablesUpdate<"content_creations"> = {};
  if (patch.metadata !== undefined) {
    update.metadata = patch.metadata as Json;
  }
  if (patch.generationProgress !== undefined) {
    update.generation_progress = patch.generationProgress;
  }
  if (patch.status !== undefined) {
    update.status = patch.status;
  }
  if (patch.page_count !== undefined) {
    update.page_count = patch.page_count;
  }
  if (patch.duration_minutes !== undefined) {
    update.duration_minutes = patch.duration_minutes;
  }
  if (patch.title !== undefined) {
    update.title = patch.title;
  }
  if (patch.description !== undefined) {
    update.description = patch.description;
  }

  const { data, error } = await supabase
    .from("content_creations")
    .update(update)
    .eq("content_key", contentKey)
    .eq("id", creationId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Creation not found");
  }

  return mapCreationRecord(data);
}

export async function updateCreationSetup(
  contentKey: string,
  creationId: string,
  setup: Record<string, unknown>,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_creations")
    .update({ setup: setup as Json })
    .eq("content_key", contentKey)
    .eq("id", creationId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Creation not found");
  }

  return mapCreationRow(data);
}

export async function recordCreationActivity(
  contentKey: string,
  creationId: string,
  action: string,
) {
  const supabase = createAdminClient();
  const insert: TablesInsert<"content_activity"> = {
    content_key: contentKey,
    creation_id: creationId,
    action,
  };

  const { error } = await supabase.from("content_activity").insert(insert);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listRecentActivity(
  contentKey: string,
  identity: ProgressIdentity,
  limit = 10,
) {
  const { buildSmartActivityFeed } = await import("./smart-activity");
  const { listConsumptionEvents } = await import("./consumption");

  const creations = await listCreations(contentKey, identity.userId);
  const events = await listConsumptionEvents(identity, limit * 2);
  return buildSmartActivityFeed(creations, events, limit);
}
