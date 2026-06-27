import type { CreationCategory } from "./types";

export interface RadioOption {
  value: string;
  label: string;
}

export interface CategoryCard {
  category: CreationCategory;
  emoji: string;
  title: string;
  description: string;
}

export const CREATION_CATEGORIES: CategoryCard[] = [
  {
    category: "story",
    emoji: "📚",
    title: "Story",
    description:
      "Write stories, novels, children's stories, educational books and more.",
  },
  {
    category: "audiobook",
    emoji: "🎧",
    title: "Audiobook",
    description:
      "Generate narrated audio stories and books with realistic voices.",
  },
  {
    category: "podcast",
    emoji: "🎙",
    title: "Podcast",
    description:
      "Create professional podcast episodes, news briefings and interviews.",
  },
];

export const STORY_TYPE_OPTIONS: RadioOption[] = [
  { value: "novel", label: "Novel" },
  { value: "childrens_book", label: "Children's Book" },
  { value: "bedtime_story", label: "Bedtime Story" },
  { value: "educational", label: "Educational" },
  { value: "fairy_tale", label: "Fairy Tale" },
  { value: "horror", label: "Horror" },
  { value: "romance", label: "Romance" },
  { value: "fantasy", label: "Fantasy" },
  { value: "sci_fi", label: "Sci-Fi" },
  { value: "mystery", label: "Mystery" },
  { value: "biography", label: "Biography" },
  { value: "custom", label: "Custom" },
];

export const STORY_AUDIENCE_OPTIONS: RadioOption[] = [
  { value: "kids", label: "Kids" },
  { value: "teen", label: "Teen" },
  { value: "adult", label: "Adult" },
];

export const STORY_LENGTH_OPTIONS: RadioOption[] = [
  { value: "5", label: "05 pages" },
  { value: "10", label: "10 pages" },
  { value: "15", label: "15 pages" },
  { value: "custom", label: "Custom" },
];

export const AUDIOBOOK_TYPE_OPTIONS: RadioOption[] = [
  { value: "novel", label: "Novel" },
  { value: "childrens_story", label: "Children's Story" },
  { value: "bedtime_story", label: "Bedtime Story" },
  { value: "self_help", label: "Self Help" },
  { value: "biography", label: "Biography" },
  { value: "educational", label: "Educational" },
  { value: "custom", label: "Custom" },
];

export const VOICE_STYLE_OPTIONS: RadioOption[] = [
  { value: "calm", label: "Calm" },
  { value: "emotional", label: "Emotional" },
  { value: "dramatic", label: "Dramatic" },
  { value: "storyteller", label: "Storyteller" },
  { value: "custom", label: "Custom" },
];

export const PODCAST_TYPE_OPTIONS: RadioOption[] = [
  { value: "news", label: "News" },
  { value: "educational", label: "Educational" },
  { value: "interview", label: "Interview" },
  { value: "solo", label: "Solo" },
  { value: "debate", label: "Debate" },
  { value: "storytelling", label: "Storytelling" },
  { value: "business", label: "Business" },
  { value: "technology", label: "Technology" },
  { value: "culture", label: "Culture" },
  { value: "sports", label: "Sports" },
  { value: "custom", label: "Custom" },
];

export const NEWS_TYPE_OPTIONS: RadioOption[] = [
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "politics", label: "Politics" },
  { value: "world", label: "World" },
  { value: "science", label: "Science" },
  { value: "entertainment", label: "Entertainment" },
];

export const EDUCATIONAL_SUBJECT_OPTIONS: RadioOption[] = [
  { value: "ai", label: "AI" },
  { value: "history", label: "History" },
  { value: "math", label: "Math" },
  { value: "health", label: "Health" },
  { value: "psychology", label: "Psychology" },
  { value: "custom", label: "Custom" },
];

export const INTERVIEW_PARTICIPANT_OPTIONS: RadioOption[] = [
  { value: "one_host", label: "One Host" },
  { value: "host_guest", label: "Host + Guest" },
  { value: "roundtable", label: "Roundtable" },
];

export const CUSTOM_VALUE = "custom";

export function getCategoryMeta(category: CreationCategory) {
  return CREATION_CATEGORIES.find((c) => c.category === category)!;
}
