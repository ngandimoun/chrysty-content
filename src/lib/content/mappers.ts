import { formatPipelineError } from "@/lib/ai/gemini-errors";
import type { Tables } from "@/lib/supabase/database.types";
import { mapProgressRowToSnapshot } from "@/lib/content/consumption";
import type { ConsumptionProgressRow } from "@/lib/content/progress-identity";
import type {
  Creation,
  PipelineStatus,
  RecentActivity,
} from "@/types/creation";
import { pipelineStatusSchema } from "@/types/content-metadata";

import { buildCreationCoverPath } from "./cover-url";

export type ContentCreationRow = Tables<"content_creations">;
export type ContentActivityRow = Tables<"content_activity">;

export interface ParsedCreationMetadata {
  coverUrl?: string;
  coverAssetId?: string;
  excerpt?: string;
  pipelineStatus?: PipelineStatus;
  pipelineStep?: string;
  generationError?: string;
  actualDurationMinutes?: number;
  targetDurationMinutes?: number;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function extractCreationMetadata(metadata: unknown): ParsedCreationMetadata {
  const root = readRecord(metadata);
  if (!root) {
    return {};
  }

  const display = readRecord(root.display);
  const pipeline = readRecord(root.pipeline);
  const audio = readRecord(root.audio);

  const pipelineStatusRaw = readString(pipeline?.status);
  const pipelineStatus = pipelineStatusRaw
    ? pipelineStatusSchema.safeParse(pipelineStatusRaw).success
      ? (pipelineStatusRaw as PipelineStatus)
      : undefined
    : undefined;

  const pipelineStep = readString(pipeline?.step);
  const rawError = readString(pipeline?.error);
  const actualDurationRaw = audio?.actualDurationMinutes;
  const actualDurationMinutes =
    typeof actualDurationRaw === "number" && actualDurationRaw > 0
      ? actualDurationRaw
      : undefined;
  const targetDurationRaw = audio?.targetDurationMinutes;
  const targetDurationMinutes =
    typeof targetDurationRaw === "number" && targetDurationRaw > 0
      ? targetDurationRaw
      : undefined;

  return {
    coverUrl: readString(display?.coverUrl),
    coverAssetId: readString(display?.coverAssetId),
    excerpt: readString(display?.excerpt),
    pipelineStatus,
    pipelineStep,
    generationError: rawError
      ? formatPipelineError(rawError, pipelineStep)
      : undefined,
    actualDurationMinutes,
    targetDurationMinutes,
  };
}

function parseCreationMetadata(metadata: unknown): ParsedCreationMetadata {
  return extractCreationMetadata(metadata);
}

export function enrichCreationForClient(
  creation: Creation,
  contentKey: string,
): Creation {
  if (creation.coverAssetId || creation.coverUrl) {
    return {
      ...creation,
      coverUrl: buildCreationCoverPath(creation.id, contentKey),
    };
  }

  return creation;
}

export function mapCreationRow(
  row: ContentCreationRow,
  progressRow?: ConsumptionProgressRow,
): Creation {
  const meta = parseCreationMetadata(row.metadata);
  const generationProgress = row.generation_progress ?? undefined;

  const base: Creation = {
    id: row.id,
    title: row.title,
    type: row.type as Creation["type"],
    category: row.category as Creation["category"],
    contentSubtype: row.content_subtype ?? undefined,
    status: row.status as Creation["status"],
    artworkGradient: row.artwork_gradient,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastOpenedAt: row.last_opened_at,
    durationMinutes: row.duration_minutes ?? undefined,
    actualDurationMinutes: meta.actualDurationMinutes,
    targetDurationMinutes: meta.targetDurationMinutes,
    pageCount: row.page_count ?? undefined,
    isFavorite: row.is_favorite,
    generationProgress,
    progress: generationProgress,
    tags: row.tags.length > 0 ? row.tags : undefined,
    topic: row.topic ?? undefined,
    description: row.description ?? undefined,
    coverUrl: meta.coverUrl,
    coverAssetId: meta.coverAssetId,
    excerpt: meta.excerpt,
    pipelineStatus: meta.pipelineStatus,
    pipelineStep: meta.pipelineStep,
    generationError: meta.generationError,
    archivedAt: row.archived_at ?? undefined,
  };

  if (progressRow) {
    base.consumption = mapProgressRowToSnapshot(progressRow, base);
    if (progressRow.last_opened_at) {
      base.lastOpenedAt = progressRow.last_opened_at;
    }
  } else if (row.status === "completed") {
    base.consumption = {
      status: "not_started",
      progressPercent: 0,
      timeSpentSeconds: 0,
    };
  }

  return base;
}

export function mapCreationRowForClient(
  row: ContentCreationRow,
  contentKey: string,
  progressRow?: ConsumptionProgressRow,
): Creation {
  return enrichCreationForClient(mapCreationRow(row, progressRow), contentKey);
}

export function mapActivityRow(
  row: ContentActivityRow,
  titleByCreationId: Map<string, string>,
): RecentActivity {
  return {
    id: row.id,
    creationId: row.creation_id,
    title: titleByCreationId.get(row.creation_id) ?? "Untitled",
    action: row.action,
    timestamp: row.created_at,
  };
}
