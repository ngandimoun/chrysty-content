import { z } from "zod";

import { CUSTOM_VALUE } from "./creation-options";
import {
  DEFAULT_CREATION_LANGUAGE,
  SUPPORTED_LANGUAGE_CODES,
} from "./supported-languages";

const creationLanguageField = z.object({
  language: z.enum(SUPPORTED_LANGUAGE_CODES, {
    message: "Select a language",
  }),
});

function requireCustomText(
  value: string | undefined,
  selected: string,
  ctx: z.RefinementCtx,
  path: string,
  message = "Please describe your custom option",
) {
  if (selected === CUSTOM_VALUE && (!value || value.trim().length === 0)) {
    ctx.addIssue({
      code: "custom",
      message,
      path: [path],
    });
  }
}

export const storyCreationSchema = creationLanguageField
  .extend({
    category: z.literal("story"),
    storyType: z.string().min(1, "Select a story type"),
    storyTypeCustom: z.string().optional(),
    mainIdea: z
      .string()
      .min(1, "Describe your main idea")
      .max(2000, "Main idea is too long"),
    audience: z.enum(["kids", "teen", "adult"]),
    length: z.enum(["5", "10", "15", "custom"]),
    lengthCustom: z.number().min(1).max(15).optional(),
  })
  .superRefine((data, ctx) => {
    requireCustomText(
      data.storyTypeCustom,
      data.storyType,
      ctx,
      "storyTypeCustom",
    );

    if (data.length === "custom") {
      if (data.lengthCustom === undefined || Number.isNaN(data.lengthCustom)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a page count",
          path: ["lengthCustom"],
        });
      } else if (data.lengthCustom < 1 || data.lengthCustom > 15) {
        ctx.addIssue({
          code: "custom",
          message: "Page count must be between 1 and 15",
          path: ["lengthCustom"],
        });
      }
    }
  });

export const audiobookCreationSchema = creationLanguageField
  .extend({
    category: z.literal("audiobook"),
    audiobookType: z.string().min(1, "Select an audiobook type"),
    audiobookTypeCustom: z.string().optional(),
    topicIdea: z
      .string()
      .min(1, "Describe your topic or idea")
      .max(2000, "Topic is too long"),
    voiceStyle: z.string().min(1, "Select a voice style"),
    voiceStyleCustom: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    requireCustomText(
      data.audiobookTypeCustom,
      data.audiobookType,
      ctx,
      "audiobookTypeCustom",
    );
    requireCustomText(
      data.voiceStyleCustom,
      data.voiceStyle,
      ctx,
      "voiceStyleCustom",
      "Please describe your custom voice style",
    );
  });

export const podcastCreationSchema = creationLanguageField
  .extend({
    category: z.literal("podcast"),
    podcastType: z.string().min(1, "Select a podcast type"),
    podcastTypeCustom: z.string().optional(),
    newsType: z.string().optional(),
    subject: z.string().optional(),
    subjectCustom: z.string().optional(),
    participants: z.string().optional(),
    topicIdea: z
      .string()
      .min(1, "Describe your topic or idea")
      .max(2000, "Topic is too long"),
  })
  .superRefine((data, ctx) => {
    requireCustomText(
      data.podcastTypeCustom,
      data.podcastType,
      ctx,
      "podcastTypeCustom",
    );

    if (data.podcastType === "news" && !data.newsType) {
      ctx.addIssue({
        code: "custom",
        message: "Select a news type",
        path: ["newsType"],
      });
    }

    if (data.podcastType === "educational") {
      if (!data.subject) {
        ctx.addIssue({
          code: "custom",
          message: "Select a subject",
          path: ["subject"],
        });
      } else {
        requireCustomText(
          data.subjectCustom,
          data.subject,
          ctx,
          "subjectCustom",
          "Please describe your custom subject",
        );
      }
    }

    if (data.podcastType === "interview" && !data.participants) {
      ctx.addIssue({
        code: "custom",
        message: "Select participants",
        path: ["participants"],
      });
    }
  });

export const creationInputSchema = z.discriminatedUnion("category", [
  storyCreationSchema,
  audiobookCreationSchema,
  podcastCreationSchema,
]);

export type StoryCreationFormValues = z.infer<typeof storyCreationSchema>;
export type AudiobookCreationFormValues = z.infer<
  typeof audiobookCreationSchema
>;
export type PodcastCreationFormValues = z.infer<typeof podcastCreationSchema>;

export const STORY_DEFAULT_VALUES: StoryCreationFormValues = {
  category: "story",
  language: DEFAULT_CREATION_LANGUAGE,
  storyType: "",
  storyTypeCustom: "",
  mainIdea: "",
  audience: "adult",
  length: "10",
  lengthCustom: undefined,
};

export const AUDIOBOOK_DEFAULT_VALUES: AudiobookCreationFormValues = {
  category: "audiobook",
  language: DEFAULT_CREATION_LANGUAGE,
  audiobookType: "",
  audiobookTypeCustom: "",
  topicIdea: "",
  voiceStyle: "",
  voiceStyleCustom: "",
};

export const PODCAST_DEFAULT_VALUES: PodcastCreationFormValues = {
  category: "podcast",
  language: DEFAULT_CREATION_LANGUAGE,
  podcastType: "",
  podcastTypeCustom: "",
  newsType: "",
  subject: "",
  subjectCustom: "",
  participants: "",
  topicIdea: "",
};
