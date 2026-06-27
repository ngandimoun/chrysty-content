import type { CreationType } from "@/types/creation";

export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
} as const;

/** Shared creation list grid — 1 col mobile, 2 col tablet+ (matches desktop card width) */
export const CREATION_LIST_GRID_CLASS =
  "grid gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4";

export const CREATION_SECTION_HEADING_CLASS =
  "mb-4 text-lg font-semibold tracking-tight md:text-xl lg:text-lg";

export const CREATION_TYPE_LABELS: Record<CreationType, string> = {
  story: "Story",
  podcast: "Podcast",
  speech: "Speech",
  brief: "Brief",
  audiobook: "Audiobook",
  bedtime_story: "Bedtime Story",
  script: "Script",
};

export const CREATION_CTA_LABELS: Record<CreationType, string> = {
  story: "Continue Reading",
  podcast: "Resume Listening",
  speech: "Practice Again",
  brief: "Listen",
  audiobook: "Continue Listening",
  bedtime_story: "Read Again",
  script: "Open Script",
};

export const CREATION_TYPE_BADGE_CLASSES: Record<CreationType, string> = {
  story: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  podcast: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  speech: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  brief: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  audiobook: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  bedtime_story: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  script: "bg-stone-500/10 text-stone-700 dark:text-stone-300",
};

export const ALL_CREATION_TYPES = Object.keys(
  CREATION_TYPE_LABELS,
) as CreationType[];
