"use client";

import { formatDistanceToNow } from "@/lib/format";
import {
  CREATION_CTA_LABELS,
  CREATION_TYPE_BADGE_CLASSES,
  CREATION_TYPE_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

export function formatCreationMeta(creation: Creation): string {
  const lastOpened = formatDistanceToNow(creation.lastOpenedAt);
  if (creation.durationMinutes) {
    const mins = creation.durationMinutes;
    const duration =
      mins >= 60
        ? `${Math.floor(mins / 60)}h ${mins % 60}m`
        : `${mins} min`;
    return `Opened ${lastOpened} · ${duration}`;
  }
  if (creation.pageCount) {
    return `Opened ${lastOpened} · ${creation.pageCount} pages`;
  }
  return `Opened ${lastOpened}`;
}

export function getCreationCta(type: Creation["type"]): string {
  return CREATION_CTA_LABELS[type];
}

export function getTypeLabel(type: Creation["type"]): string {
  return CREATION_TYPE_LABELS[type];
}

export function getTypeBadgeClass(type: Creation["type"]): string {
  return CREATION_TYPE_BADGE_CLASSES[type];
}

export function creationArtworkClass(creation: Creation): string {
  return cn("bg-gradient-to-br", creation.artworkGradient);
}
