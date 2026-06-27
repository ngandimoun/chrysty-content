import type { ConsumptionSnapshot } from "./consumption";

export type CreationType =
  | "story"
  | "podcast"
  | "speech"
  | "brief"
  | "audiobook"
  | "bedtime_story"
  | "script";

export type CreationCategory = "story" | "audiobook" | "podcast";

export type CreationStatus =
  | "completed"
  | "draft"
  | "generating"
  | "failed"
  | "archived";

export type PipelineStatus =
  | "planning"
  | "writing"
  | "illustrating"
  | "composing"
  | "completed"
  | "failed";

export interface Creation {
  id: string;
  title: string;
  type: CreationType;
  category: CreationCategory;
  contentSubtype?: string;
  status: CreationStatus;
  artworkGradient: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  durationMinutes?: number;
  /** Measured audio length from generation metadata (preferred over durationMinutes when inflated). */
  actualDurationMinutes?: number;
  /** Planned audio length from generation metadata (fallback when measured duration is corrupt). */
  targetDurationMinutes?: number;
  pageCount?: number;
  isFavorite: boolean;
  /** @deprecated Use generationProgress for pipeline and consumption.progressPercent for reading/listening */
  progress?: number;
  generationProgress?: number;
  consumption?: ConsumptionSnapshot;
  tags?: string[];
  topic?: string;
  description?: string;
  coverUrl?: string;
  coverAssetId?: string;
  excerpt?: string;
  pipelineStatus?: PipelineStatus;
  pipelineStep?: string;
  generationError?: string;
  archivedAt?: string;
}

export interface RecentActivity {
  id: string;
  creationId: string;
  title: string;
  action: string;
  timestamp: string;
  eventType?: string;
  category?: CreationCategory;
}
