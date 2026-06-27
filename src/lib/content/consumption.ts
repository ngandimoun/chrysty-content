import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import type {
  ConsumptionAnnotation,
  ConsumptionEventInput,
  ConsumptionProgressPatch,
  ConsumptionSnapshot,
  UserProfileStats,
} from "@/types/consumption";
import {
  ABANDONED_THRESHOLD_DAYS,
  consumptionStatusSchema,
  resumeContextSchema,
} from "@/types/consumption";
import type { Creation, CreationCategory } from "@/types/creation";
import type {
  AnnotationInput,
  CollectionShelfId,
  ResumeContext,
} from "@/types/consumption";
import {
  buildIdentityFilter,
  identityInsertFields,
  type ConsumptionProgressRow,
  type ProgressIdentity,
} from "./progress-identity";
import { getEffectiveDurationMinutes } from "@/lib/content/effective-duration";

function readResumeContext(value: unknown): ResumeContext | undefined {
  const parsed = resumeContextSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

function deriveEffectiveStatus(
  row: ConsumptionProgressRow,
): ConsumptionSnapshot["status"] {
  const base = consumptionStatusSchema.safeParse(row.consumption_status);
  const status = base.success ? base.data : "not_started";

  if (status === "in_progress" && row.last_opened_at) {
    const lastOpened = new Date(row.last_opened_at).getTime();
    const thresholdMs = ABANDONED_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - lastOpened > thresholdMs) {
      return "abandoned";
    }
  }

  return status;
}

export function mapProgressRowToSnapshot(
  row: ConsumptionProgressRow,
  creation?: Pick<
    Creation,
    | "pageCount"
    | "durationMinutes"
    | "actualDurationMinutes"
    | "targetDurationMinutes"
    | "category"
  >,
): ConsumptionSnapshot {
  const status = deriveEffectiveStatus(row);
  const progressPercent = Number(row.progress_percent);
  let estimatedTimeLeftSeconds: number | undefined;

  const effectiveDuration = creation
    ? getEffectiveDurationMinutes(creation)
    : undefined;

  if (effectiveDuration && progressPercent < 100) {
    const totalSeconds = effectiveDuration * 60;
    estimatedTimeLeftSeconds = Math.round(
      totalSeconds * (1 - progressPercent / 100),
    );
  } else if (creation?.pageCount && progressPercent < 100) {
    const minutesPerPage = 1.5;
    const remainingPages = Math.ceil(
      creation.pageCount * (1 - progressPercent / 100),
    );
    estimatedTimeLeftSeconds = Math.round(remainingPages * minutesPerPage * 60);
  }

  return {
    status,
    progressPercent,
    currentPage: row.current_page ?? undefined,
    currentPositionSeconds: row.current_position_seconds
      ? Number(row.current_position_seconds)
      : undefined,
    playbackSpeed: Number(row.playback_speed),
    timeSpentSeconds: row.time_spent_seconds,
    estimatedTimeLeftSeconds,
    completedAt: row.completed_at ?? undefined,
    lastOpenedAt: row.last_opened_at ?? undefined,
    resumeContext: readResumeContext(row.resume_context),
  };
}

export async function fetchProgressForCreations(
  identity: ProgressIdentity,
  creationIds: string[],
): Promise<Map<string, ConsumptionProgressRow>> {
  const map = new Map<string, ConsumptionProgressRow>();
  if (creationIds.length === 0) {
    return map;
  }

  const supabase = createAdminClient();
  const filter = buildIdentityFilter(identity);

  let query = supabase
    .from("content_consumption_progress")
    .select("*")
    .in("creation_id", creationIds);

  if (filter.user_id) {
    query = query.eq("user_id", filter.user_id);
  } else {
    query = query.eq("content_key", filter.content_key!);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    map.set(row.creation_id, row);
  }

  return map;
}

export async function getOrCreateProgress(
  identity: ProgressIdentity,
  creationId: string,
): Promise<ConsumptionProgressRow> {
  const supabase = createAdminClient();
  const filter = buildIdentityFilter(identity);

  let query = supabase
    .from("content_consumption_progress")
    .select("*")
    .eq("creation_id", creationId);

  if (filter.user_id) {
    query = query.eq("user_id", filter.user_id);
  } else {
    query = query.eq("content_key", filter.content_key!);
  }

  const { data: existing, error: fetchError } = await query.maybeSingle();
  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (existing) {
    return existing;
  }

  const insert: TablesInsert<"content_consumption_progress"> = {
    creation_id: creationId,
    ...identityInsertFields(identity),
    consumption_status: "not_started",
    progress_percent: 0,
  };

  const { data: created, error: insertError } = await supabase
    .from("content_consumption_progress")
    .insert(insert)
    .select("*")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return created;
}

export async function seedNotStartedProgress(
  contentKey: string,
  creationId: string,
) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("content_consumption_progress")
    .select("id")
    .eq("creation_id", creationId)
    .eq("content_key", contentKey)
    .maybeSingle();

  if (existing) {
    return;
  }

  const insert: TablesInsert<"content_consumption_progress"> = {
    creation_id: creationId,
    content_key: contentKey,
    user_id: null,
    consumption_status: "not_started",
    progress_percent: 0,
  };

  const { error } = await supabase
    .from("content_consumption_progress")
    .insert(insert);

  if (error && !error.message.includes("duplicate")) {
    throw new Error(error.message);
  }
}

export async function updateProgress(
  identity: ProgressIdentity,
  creationId: string,
  patch: ConsumptionProgressPatch,
): Promise<ConsumptionProgressRow> {
  const existing = await getOrCreateProgress(identity, creationId);
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const nextStatus = patch.consumptionStatus ?? existing.consumption_status;
  const nextProgress =
    patch.progressPercent ?? Number(existing.progress_percent);
  const nextTimeSpent =
    existing.time_spent_seconds + (patch.timeSpentDeltaSeconds ?? 0);

  const update: TablesUpdate<"content_consumption_progress"> = {
    consumption_status:
      nextStatus === "not_started" && nextProgress > 0
        ? "in_progress"
        : nextStatus,
    progress_percent: nextProgress,
    time_spent_seconds: nextTimeSpent,
    last_opened_at: now,
    started_at: existing.started_at ?? (nextProgress > 0 ? now : null),
    current_page: patch.currentPage ?? existing.current_page,
    current_position_seconds:
      patch.currentPositionSeconds ?? existing.current_position_seconds,
    playback_speed: patch.playbackSpeed ?? existing.playback_speed,
    resume_context: (patch.resumeContext ??
      existing.resume_context) as Json,
    session_count:
      existing.session_count + (patch.incrementSession ? 1 : 0),
    completed_at:
      patch.consumptionStatus === "completed"
        ? now
        : existing.completed_at,
    last_played_at:
      patch.currentPositionSeconds !== undefined ? now : existing.last_played_at,
  };

  const { data, error } = await supabase
    .from("content_consumption_progress")
    .update(update)
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function recordConsumptionEvents(
  identity: ProgressIdentity,
  creationId: string,
  events: ConsumptionEventInput[],
) {
  if (events.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  const rows: TablesInsert<"content_consumption_events">[] = events.map(
    (event) => ({
      creation_id: creationId,
      ...identityInsertFields(identity),
      event_type: event.eventType,
      payload: (event.payload ?? {}) as Json,
    }),
  );

  const { error } = await supabase.from("content_consumption_events").insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAnnotations(
  identity: ProgressIdentity,
  creationId: string,
): Promise<ConsumptionAnnotation[]> {
  const supabase = createAdminClient();
  const filter = buildIdentityFilter(identity);

  let query = supabase
    .from("content_consumption_annotations")
    .select("*")
    .eq("creation_id", creationId)
    .order("created_at", { ascending: false });

  if (filter.user_id) {
    query = query.eq("user_id", filter.user_id);
  } else {
    query = query.eq("content_key", filter.content_key!);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    creationId: row.creation_id,
    kind: row.kind as ConsumptionAnnotation["kind"],
    pageNumber: row.page_number ?? undefined,
    segmentId: row.segment_id ?? undefined,
    positionSeconds: row.position_seconds
      ? Number(row.position_seconds)
      : undefined,
    anchorText: row.anchor_text ?? undefined,
    selectedText: row.selected_text ?? undefined,
    noteText: row.note_text ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createAnnotation(
  identity: ProgressIdentity,
  creationId: string,
  input: AnnotationInput,
): Promise<ConsumptionAnnotation> {
  const supabase = createAdminClient();
  const insert: TablesInsert<"content_consumption_annotations"> = {
    creation_id: creationId,
    ...identityInsertFields(identity),
    kind: input.kind,
    page_number: input.pageNumber ?? null,
    segment_id: input.segmentId ?? null,
    position_seconds: input.positionSeconds ?? null,
    anchor_text: input.anchorText ?? null,
    selected_text: input.selectedText ?? null,
    note_text: input.noteText ?? null,
  };

  const { data, error } = await supabase
    .from("content_consumption_annotations")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    creationId: data.creation_id,
    kind: data.kind as ConsumptionAnnotation["kind"],
    pageNumber: data.page_number ?? undefined,
    segmentId: data.segment_id ?? undefined,
    positionSeconds: data.position_seconds
      ? Number(data.position_seconds)
      : undefined,
    anchorText: data.anchor_text ?? undefined,
    selectedText: data.selected_text ?? undefined,
    noteText: data.note_text ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteAnnotation(
  identity: ProgressIdentity,
  creationId: string,
  annotationId: string,
) {
  const supabase = createAdminClient();
  const filter = buildIdentityFilter(identity);

  let query = supabase
    .from("content_consumption_annotations")
    .delete()
    .eq("id", annotationId)
    .eq("creation_id", creationId);

  if (filter.user_id) {
    query = query.eq("user_id", filter.user_id);
  } else {
    query = query.eq("content_key", filter.content_key!);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}

export { deriveResumeContextFromAudio, deriveResumeContextFromBook } from "./resume-context";

export function buildCollections(
  creations: Creation[],
  shelf: CollectionShelfId,
): Creation[] {
  const completed = creations.filter((c) => c.status === "completed");

  switch (shelf) {
    case "continue_reading":
      return completed
        .filter(
          (c) =>
            c.category === "story" &&
            c.consumption &&
            (c.consumption.status === "in_progress" ||
              c.consumption.status === "abandoned"),
        )
        .sort(
          (a, b) =>
            new Date(b.consumption!.lastOpenedAt ?? b.lastOpenedAt).getTime() -
            new Date(a.consumption!.lastOpenedAt ?? a.lastOpenedAt).getTime(),
        );
    case "continue_listening":
      return completed
        .filter(
          (c) =>
            (c.category === "audiobook" || c.category === "podcast") &&
            c.consumption &&
            (c.consumption.status === "in_progress" ||
              c.consumption.status === "abandoned"),
        )
        .sort(
          (a, b) =>
            new Date(b.consumption!.lastOpenedAt ?? b.lastOpenedAt).getTime() -
            new Date(a.consumption!.lastOpenedAt ?? a.lastOpenedAt).getTime(),
        );
    case "unread":
      return completed.filter(
        (c) =>
          !c.consumption ||
          c.consumption.status === "not_started",
      );
    case "completed":
      return completed.filter(
        (c) => c.consumption?.status === "completed",
      );
    case "recent":
      return [...creations].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "favorites":
      return creations.filter((c) => c.isFavorite);
    case "archived":
      return creations.filter((c) => c.status === "archived");
    default:
      return [];
  }
}

export async function computeUserStats(
  identity: ProgressIdentity,
): Promise<UserProfileStats> {
  const supabase = createAdminClient();
  const contentKey = identity.contentKey;

  const { data: creations, error: creationsError } = await supabase
    .from("content_creations")
    .select("id, category, status")
    .eq("content_key", contentKey);

  if (creationsError) {
    throw new Error(creationsError.message);
  }

  const creationRows = creations ?? [];
  const filter = buildIdentityFilter(identity);
  let eventsQuery = supabase
    .from("content_consumption_events")
    .select("creation_id, event_type, created_at, payload")
    .order("created_at", { ascending: true });

  if (filter.user_id) {
    eventsQuery = eventsQuery.eq("user_id", filter.user_id);
  } else {
    eventsQuery = eventsQuery.eq("content_key", filter.content_key!);
  }

  const { data: events, error: eventsError } = await eventsQuery;
  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const eventRows = events ?? [];
  const completedCreationIds = new Set<string>();
  for (const event of eventRows) {
    if (event.event_type === "complete") {
      completedCreationIds.add(event.creation_id);
    }
  }

  let booksFinished = completedCreationIds.size;
  let hoursRead = 0;
  let hoursListened = 0;
  const categoryByCreation = new Map(
    creationRows.map((c) => [c.id, c.category as CreationCategory]),
  );

  for (const event of eventRows) {
    if (event.event_type !== "close" && event.event_type !== "complete") {
      continue;
    }
    const payload = event.payload as { timeSpentSeconds?: number } | null;
    const seconds = payload?.timeSpentSeconds ?? 0;
    if (seconds <= 0) continue;
    const category = categoryByCreation.get(event.creation_id);
    if (category === "story") {
      hoursRead += seconds / 3600;
    } else if (category === "audiobook" || category === "podcast") {
      hoursListened += seconds / 3600;
    }
  }

  const categoryCounts = new Map<CreationCategory, number>();

  for (const creationId of completedCreationIds) {
    const creation = creationRows.find((c) => c.id === creationId);
    if (!creation) continue;
    const cat = creation.category as CreationCategory;
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  let favoriteCategory: string | null = null;
  let maxCount = 0;
  for (const [cat, count] of categoryCounts) {
    if (count > maxCount) {
      maxCount = count;
      favoriteCategory = cat;
    }
  }

  const longestStreakDays = computeStreak(
    eventRows
      .filter((e) => e.event_type === "open" || e.event_type === "complete")
      .map((e) => e.created_at),
  );

  return {
    booksCreated: creationRows.length,
    booksFinished,
    hoursRead: Math.round(hoursRead * 10) / 10,
    hoursListened: Math.round(hoursListened * 10) / 10,
    favoriteCategory,
    longestStreakDays,
  };
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) {
    return 0;
  }

  const dayKeys = [
    ...new Set(
      dates.map((d) => {
        const date = new Date(d);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }),
    ),
  ].sort();

  let longest = 1;
  let current = 1;

  for (let i = 1; i < dayKeys.length; i++) {
    const prev = new Date(dayKeys[i - 1]!);
    const curr = new Date(dayKeys[i]!);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  return longest;
}

export async function listConsumptionEvents(
  identity: ProgressIdentity,
  limit = 20,
) {
  const supabase = createAdminClient();
  const filter = buildIdentityFilter(identity);

  let query = supabase
    .from("content_consumption_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter.user_id) {
    query = query.eq("user_id", filter.user_id);
  } else {
    query = query.eq("content_key", filter.content_key!);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
