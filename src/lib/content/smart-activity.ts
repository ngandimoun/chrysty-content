import {
  formatConsumptionLabel,
  formatTimeRemaining,
  getEffectiveConsumption,
} from "@/lib/creation-consumption-utils";
import type { ConsumptionEventType } from "@/types/consumption";
import type { Creation, CreationCategory, RecentActivity } from "@/types/creation";

export interface ConsumptionEventRow {
  id: string;
  creation_id: string;
  event_type: string;
  payload: unknown;
  created_at: string;
}

const SKIPPED_EVENT_TYPES = new Set<string>(["close", "seek"]);

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isStory(category: CreationCategory): boolean {
  return category === "story";
}

function readyLabel(creation: Creation): string {
  if (isStory(creation.category)) {
    return creation.pageCount
      ? `Ready to read · ${creation.pageCount} pages`
      : "Ready to read";
  }
  return creation.durationMinutes
    ? `Ready to listen · ${creation.durationMinutes} min`
    : "Ready to listen";
}

function continuedLabel(creation: Creation): string {
  const consumption = getEffectiveConsumption(creation);
  const progress = formatConsumptionLabel(creation);
  const verb = isStory(creation.category) ? "Continued reading" : "Continued listening";

  if (consumption?.currentPage && creation.pageCount) {
    return `${verb} · Page ${consumption.currentPage} of ${creation.pageCount}`;
  }

  if (progress && progress !== "Not started") {
    return `${verb} · ${progress}`;
  }

  return verb;
}

function finishedLabel(category: CreationCategory): string {
  return isStory(category) ? "Finished reading" : "Finished listening";
}

export function formatSmartEventAction(
  eventType: string,
  creation: Creation,
  payload: unknown,
): string | null {
  if (SKIPPED_EVENT_TYPES.has(eventType)) {
    return null;
  }

  const data = readRecord(payload);
  const consumption = getEffectiveConsumption(creation);
  const timeLeft = formatTimeRemaining(consumption?.estimatedTimeLeftSeconds);
  const pageCount = creation.pageCount;
  const toPage = readNumber(data?.toPage);

  switch (eventType as ConsumptionEventType) {
    case "open":
      return continuedLabel(creation);
    case "play":
      return isStory(creation.category) ? "Started reading" : "Started listening";
    case "resume":
      return timeLeft
        ? `Resumed ${isStory(creation.category) ? "reading" : "listening"} · ${timeLeft}`
        : `Resumed ${isStory(creation.category) ? "reading" : "listening"}`;
    case "pause":
      return timeLeft ? `Paused · ${timeLeft}` : "Paused";
    case "page_change":
      if (toPage && pageCount) {
        return `Turned to page ${toPage} of ${pageCount}`;
      }
      if (toPage) {
        return `Turned to page ${toPage}`;
      }
      return "Turned page";
    case "complete":
      return finishedLabel(creation.category);
    case "share":
      return "Shared link";
    case "download":
      return "Downloaded";
    case "bookmark":
      return "Bookmarked";
    case "highlight":
      return "Highlighted";
    case "archive":
      return "Archived";
    default:
      return null;
  }
}

function isEligibleCreation(creation: Creation): boolean {
  return (
    creation.status === "completed" &&
    !creation.archivedAt
  );
}

function buildDerivedActivities(creations: Creation[]): RecentActivity[] {
  const items: RecentActivity[] = [];

  for (const creation of creations) {
    if (!isEligibleCreation(creation)) {
      continue;
    }

    const consumption = getEffectiveConsumption(creation);

    if (!consumption) {
      continue;
    }

    if (consumption.status === "not_started") {
      items.push({
        id: `derived-ready-${creation.id}`,
        creationId: creation.id,
        title: creation.title,
        action: readyLabel(creation),
        timestamp: creation.updatedAt,
        category: creation.category,
      });
      continue;
    }

    if (
      consumption.status === "in_progress" ||
      consumption.status === "abandoned"
    ) {
      const timestamp =
        consumption.lastOpenedAt ??
        creation.lastOpenedAt ??
        creation.updatedAt;

      items.push({
        id: `derived-continue-${creation.id}`,
        creationId: creation.id,
        title: creation.title,
        action: continuedLabel(creation),
        timestamp,
        category: creation.category,
      });
      continue;
    }

    if (consumption.status === "completed" && consumption.completedAt) {
      items.push({
        id: `derived-finished-${creation.id}`,
        creationId: creation.id,
        title: creation.title,
        action: finishedLabel(creation.category),
        timestamp: consumption.completedAt,
        eventType: "complete",
        category: creation.category,
      });
    }
  }

  return items;
}

function buildEventActivities(
  events: ConsumptionEventRow[],
  creationById: Map<string, Creation>,
): RecentActivity[] {
  const items: RecentActivity[] = [];

  for (const row of events) {
    const creation = creationById.get(row.creation_id);
    if (!creation || !isEligibleCreation(creation)) {
      continue;
    }

    const action = formatSmartEventAction(
      row.event_type,
      creation,
      row.payload,
    );
    if (!action) {
      continue;
    }

    items.push({
      id: row.id,
      creationId: row.creation_id,
      title: creation.title,
      action,
      timestamp: row.created_at,
      eventType: row.event_type,
      category: creation.category,
    });
  }

  return items;
}

export function buildSmartActivityFeed(
  creations: Creation[],
  events: ConsumptionEventRow[],
  limit = 10,
): RecentActivity[] {
  const eligible = creations.filter(isEligibleCreation);
  const creationById = new Map(eligible.map((c) => [c.id, c]));

  const merged = [
    ...buildEventActivities(events, creationById),
    ...buildDerivedActivities(eligible),
  ].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const seen = new Set<string>();
  const deduped: RecentActivity[] = [];

  for (const item of merged) {
    if (seen.has(item.creationId)) {
      continue;
    }
    seen.add(item.creationId);
    deduped.push(item);
    if (deduped.length >= limit) {
      break;
    }
  }

  return deduped;
}
