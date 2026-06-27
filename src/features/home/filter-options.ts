import type { CreationCategory, CreationStatus } from "@/types/creation";

export const FILTER_SORT_OPTIONS = [
  { value: "recently_created", label: "Recently Created" },
  { value: "last_opened", label: "Last Opened" },
  { value: "recently_updated", label: "Recently Updated" },
  { value: "alphabetical", label: "Alphabetical (A–Z)" },
  { value: "favorites", label: "Favorites" },
] as const;

export const FILTER_CATEGORY_OPTIONS: {
  value: CreationCategory;
  label: string;
}[] = [
  { value: "story", label: "Story" },
  { value: "audiobook", label: "Audiobooks" },
  { value: "podcast", label: "Podcasts" },
];

export const FILTER_STORY_SUBTYPE_OPTIONS = [
  { value: "novel", label: "Novel" },
  { value: "childrens_book", label: "Children's Book" },
  { value: "bedtime_story", label: "Bedtime Story" },
  { value: "fantasy", label: "Fantasy" },
  { value: "mystery", label: "Mystery" },
  { value: "horror", label: "Horror" },
  { value: "romance", label: "Romance" },
  { value: "educational", label: "Educational" },
  { value: "biography", label: "Biography" },
  { value: "sci_fi", label: "Sci-Fi" },
] as const;

export const FILTER_AUDIOBOOK_SUBTYPE_OPTIONS = [
  { value: "novel", label: "Novel" },
  { value: "childrens_story", label: "Children's Story" },
  { value: "bedtime_story", label: "Bedtime Story" },
  { value: "educational", label: "Educational" },
  { value: "self_help", label: "Self Help" },
  { value: "biography", label: "Biography" },
] as const;

export const FILTER_PODCAST_SUBTYPE_OPTIONS = [
  { value: "news", label: "News" },
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "education", label: "Education" },
  { value: "interview", label: "Interview" },
  { value: "storytelling", label: "Storytelling" },
  { value: "culture", label: "Culture" },
  { value: "sports", label: "Sports" },
  { value: "solo_commentary", label: "Solo Commentary" },
] as const;

export const FILTER_STATUS_OPTIONS: {
  value: CreationStatus;
  label: string;
}[] = [
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Draft" },
  { value: "generating", label: "Generating" },
  { value: "failed", label: "Failed" },
  { value: "archived", label: "Archived" },
];

export const FILTER_GENERATION_OPTIONS = [
  { value: "ready", label: "Ready (not started)" },
] as const;

export const FILTER_CONSUMPTION_STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Finished reading/listening" },
  { value: "abandoned", label: "Abandoned" },
] as const;

export const FILTER_CREATED_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
] as const;

export const FILTER_STORY_PAGES_OPTIONS = [
  { value: "any", label: "Any pages" },
  { value: "5", label: "05 pages" },
  { value: "10", label: "10 pages" },
  { value: "15", label: "15 pages" },
] as const;

export const FILTER_AUDIO_DURATION_OPTIONS = [
  { value: "any", label: "Any duration" },
  { value: "under_5", label: "Under 5 minutes" },
  { value: "5_to_15", label: "5–15 minutes" },
  { value: "over_15", label: "15+ minutes" },
] as const;
