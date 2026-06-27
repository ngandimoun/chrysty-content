export type CreationCategory = "story" | "audiobook" | "podcast";

export type StoryAudience = "kids" | "teen" | "adult";

export type StoryLength = "5" | "10" | "15" | "custom";

export interface ReferenceFilesSetup {
  /** Populated server-side after upload; not sent from the client form. */
  referenceFileAssetIds?: string[];
}

export interface StoryCreationInput extends ReferenceFilesSetup {
  category: "story";
  language: string;
  storyType: string;
  storyTypeCustom?: string;
  mainIdea: string;
  audience: StoryAudience;
  length: StoryLength;
  lengthCustom?: number;
}

export interface AudiobookCreationInput extends ReferenceFilesSetup {
  category: "audiobook";
  language: string;
  audiobookType: string;
  audiobookTypeCustom?: string;
  topicIdea: string;
  voiceStyle: string;
  voiceStyleCustom?: string;
}

export interface PodcastCreationInput extends ReferenceFilesSetup {
  category: "podcast";
  language: string;
  podcastType: string;
  podcastTypeCustom?: string;
  newsType?: string;
  subject?: string;
  subjectCustom?: string;
  participants?: string;
  topicIdea: string;
}

export type CreationInput =
  | StoryCreationInput
  | AudiobookCreationInput
  | PodcastCreationInput;

export type WizardStep = "category" | "form";
