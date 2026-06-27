import type { Creation } from "@/types/creation";
import type { ConsumptionSnapshot } from "@/types/consumption";

import { getEffectiveDurationMinutes } from "@/lib/content/effective-duration";
import { getCreationCta } from "./creation-utils";

export { getEffectiveDurationMinutes } from "@/lib/content/effective-duration";

export function getEffectiveConsumption(
  creation: Creation,
): ConsumptionSnapshot | undefined {
  if (creation.status !== "completed") {
    return undefined;
  }
  return (
    creation.consumption ?? {
      status: "not_started",
      progressPercent: 0,
      timeSpentSeconds: 0,
    }
  );
}

export function formatTimeRemaining(seconds: number | undefined): string {
  if (seconds === undefined || seconds <= 0) {
    return "";
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min left`;
  }
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m left` : `${hours}h left`;
}

export function formatConsumptionLabel(creation: Creation): string {
  const consumption = getEffectiveConsumption(creation);
  if (!consumption) {
    return "";
  }

  if (consumption.status === "completed") {
    if (consumption.completedAt) {
      const date = new Date(consumption.completedAt);
      const diffDays = Math.floor(
        (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (diffDays === 0) return "Completed today";
      if (diffDays === 1) return "Completed yesterday";
      return `Completed ${diffDays} days ago`;
    }
    return "Completed";
  }

  if (
    consumption.status === "in_progress" ||
    consumption.status === "abandoned"
  ) {
    const timeLeft = formatTimeRemaining(consumption.estimatedTimeLeftSeconds);
    const pct = Math.round(consumption.progressPercent);
    return timeLeft ? `${pct}% · ${timeLeft}` : `${pct}% complete`;
  }

  if (creation.pageCount) {
    return `Not started · ${creation.pageCount} pages`;
  }
  const duration = getEffectiveDurationMinutes(creation);
  if (duration) {
    return `Not started · ${duration} min`;
  }
  return "Not started";
}

export function getSmartCta(creation: Creation): string {
  const consumption = getEffectiveConsumption(creation);
  if (!consumption) {
    return getCreationCta(creation.type);
  }

  if (consumption.status === "completed") {
    return creation.category === "story" ? "Read again" : "Replay";
  }

  if (
    consumption.status === "in_progress" ||
    consumption.status === "abandoned"
  ) {
    return "Resume";
  }

  return getCreationCta(creation.type);
}

export function getGenerationProgress(creation: Creation): number {
  return creation.generationProgress ?? creation.progress ?? 0;
}
