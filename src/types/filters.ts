import type { CreationCategory, CreationStatus } from "./creation";

export type SortOption =
  | "recently_created"
  | "last_opened"
  | "recently_updated"
  | "alphabetical"
  | "favorites";

export type CreatedFilter =
  | "today"
  | "this_week"
  | "this_month"
  | "custom";

export type StoryPagesFilter = "5" | "10" | "15" | "any";

export type AudioDurationFilter = "under_5" | "5_to_15" | "over_15" | "any";

export type ConsumptionStatusFilter =
  | "not_started"
  | "in_progress"
  | "completed"
  | "abandoned";

export type GenerationFilter = "ready";

export interface FilterState {
  sort: SortOption;
  categories: CreationCategory[];
  storySubtypes: string[];
  audiobookSubtypes: string[];
  podcastSubtypes: string[];
  statuses: CreationStatus[];
  consumptionStatuses: ConsumptionStatusFilter[];
  generationFilters: GenerationFilter[];
  created: CreatedFilter | null;
  createdFrom?: string;
  createdTo?: string;
  storyPages: StoryPagesFilter | null;
  audioDuration: AudioDurationFilter | null;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  sort: "recently_created",
  categories: [],
  storySubtypes: [],
  audiobookSubtypes: [],
  podcastSubtypes: [],
  statuses: [],
  consumptionStatuses: [],
  generationFilters: [],
  created: null,
  createdFrom: undefined,
  createdTo: undefined,
  storyPages: null,
  audioDuration: null,
};
