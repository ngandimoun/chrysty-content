import { z } from "zod";

export const consumptionStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "abandoned",
]);

export type ConsumptionStatus = z.infer<typeof consumptionStatusSchema>;

export const consumptionEventTypeSchema = z.enum([
  "open",
  "close",
  "play",
  "pause",
  "resume",
  "seek",
  "page_change",
  "bookmark",
  "highlight",
  "share",
  "download",
  "complete",
  "archive",
]);

export type ConsumptionEventType = z.infer<typeof consumptionEventTypeSchema>;

export const annotationKindSchema = z.enum([
  "bookmark",
  "highlight",
  "note",
  "quote",
]);

export type AnnotationKind = z.infer<typeof annotationKindSchema>;

export const resumeContextSchema = z.object({
  sectionIndex: z.number().optional(),
  sectionTitle: z.string().optional(),
  excerpt: z.string().optional(),
  summary: z.string().optional(),
});

export type ResumeContext = z.infer<typeof resumeContextSchema>;

export const consumptionSnapshotSchema = z.object({
  status: consumptionStatusSchema,
  progressPercent: z.number(),
  currentPage: z.number().optional(),
  currentPositionSeconds: z.number().optional(),
  playbackSpeed: z.number().optional(),
  timeSpentSeconds: z.number(),
  estimatedTimeLeftSeconds: z.number().optional(),
  completedAt: z.string().optional(),
  lastOpenedAt: z.string().optional(),
  resumeContext: resumeContextSchema.optional(),
});

export type ConsumptionSnapshot = z.infer<typeof consumptionSnapshotSchema>;

export const consumptionProgressPatchSchema = z.object({
  consumptionStatus: consumptionStatusSchema.optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  currentPage: z.number().int().positive().optional(),
  currentPositionSeconds: z.number().min(0).optional(),
  playbackSpeed: z.number().min(0.25).max(3).optional(),
  timeSpentDeltaSeconds: z.number().int().min(0).optional(),
  resumeContext: resumeContextSchema.optional(),
  incrementSession: z.boolean().optional(),
});

export type ConsumptionProgressPatch = z.infer<
  typeof consumptionProgressPatchSchema
>;

export const consumptionEventInputSchema = z.object({
  eventType: consumptionEventTypeSchema,
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type ConsumptionEventInput = z.infer<typeof consumptionEventInputSchema>;

export const annotationInputSchema = z.object({
  kind: annotationKindSchema,
  pageNumber: z.number().int().positive().optional(),
  segmentId: z.string().optional(),
  positionSeconds: z.number().min(0).optional(),
  anchorText: z.string().optional(),
  selectedText: z.string().optional(),
  noteText: z.string().optional(),
});

export type AnnotationInput = z.infer<typeof annotationInputSchema>;

export interface ConsumptionAnnotation {
  id: string;
  creationId: string;
  kind: AnnotationKind;
  pageNumber?: number;
  segmentId?: string;
  positionSeconds?: number;
  anchorText?: string;
  selectedText?: string;
  noteText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileStats {
  booksCreated: number;
  booksFinished: number;
  hoursRead: number;
  hoursListened: number;
  favoriteCategory: string | null;
  longestStreakDays: number;
}

export type CollectionShelfId =
  | "continue_reading"
  | "continue_listening"
  | "unread"
  | "completed"
  | "recent"
  | "favorites"
  | "archived";

export const ABANDONED_THRESHOLD_DAYS = 30;
