import { z } from "zod";

import { coerceTtsPrompt } from "@/lib/ai/audio/normalize-plan";

export type CreationAssetType =
  | "audio"
  | "cover"
  | "script"
  | "source"
  | "illustration";

export const CREATION_ASSET_TYPES = [
  "audio",
  "cover",
  "script",
  "source",
  "illustration",
] as const satisfies readonly CreationAssetType[];

export const GEMINI_VOICE_CATALOG = [
  { id: "Zephyr", style: "Bright" },
  { id: "Puck", style: "Upbeat" },
  { id: "Charon", style: "Informative" },
  { id: "Kore", style: "Firm" },
  { id: "Fenrir", style: "Excitable" },
  { id: "Leda", style: "Youthful" },
  { id: "Orus", style: "Firm" },
  { id: "Aoede", style: "Breezy" },
  { id: "Callirrhoe", style: "Easy-going" },
  { id: "Autonoe", style: "Bright" },
  { id: "Enceladus", style: "Breathy" },
  { id: "Iapetus", style: "Clear" },
  { id: "Umbriel", style: "Easy-going" },
  { id: "Algieba", style: "Smooth" },
  { id: "Despina", style: "Smooth" },
  { id: "Erinome", style: "Clear" },
  { id: "Algenib", style: "Gravelly" },
  { id: "Rasalgethi", style: "Informative" },
  { id: "Laomedeia", style: "Upbeat" },
  { id: "Achernar", style: "Soft" },
  { id: "Alnilam", style: "Firm" },
  { id: "Schedar", style: "Even" },
  { id: "Gacrux", style: "Mature" },
  { id: "Pulcherrima", style: "Forward" },
  { id: "Achird", style: "Friendly" },
  { id: "Zubenelgenubi", style: "Casual" },
  { id: "Vindemiatrix", style: "Gentle" },
  { id: "Sadachbia", style: "Lively" },
  { id: "Sadaltager", style: "Knowledgeable" },
  { id: "Sulafat", style: "Warm" },
] as const;

export type GeminiVoiceId = (typeof GEMINI_VOICE_CATALOG)[number]["id"];

export const pipelineStatusSchema = z.enum([
  "planning",
  "writing",
  "illustrating",
  "composing",
  "completed",
  "failed",
]);

export const assetMetadataRoleSchema = z.enum([
  "card_cover",
  "title_hero",
  "illustration",
  "explanation",
  "diagram",
  "book_manifest",
  "audio_manifest",
  "story_plan",
  "audio_plan",
  "script",
  "audio",
  "narration",
]);

export const assetMetadataSchema = z.object({
  role: assetMetadataRoleSchema,
  pageNumber: z.number().int().positive().optional(),
  slotId: z.string().optional(),
  segmentId: z.string().optional(),
  sequence: z.number().int().nonnegative().optional(),
  altText: z.string().min(1),
  caption: z.string().optional(),
  prompt: z.string().optional(),
  model: z.string().optional(),
  aspectRatio: z.string().optional(),
  durationSeconds: z.number().positive().optional(),
  status: z.enum(["ready", "failed"]).optional(),
});

export type AssetMetadata = z.infer<typeof assetMetadataSchema>;

export const audioSpeakerSchema = z.object({
  name: z.string(),
  voice: z.string(),
  role: z.string(),
  audioProfile: z.string().optional(),
});

export const audioSegmentPlanSchema = z.object({
  segmentId: z.string(),
  speakerNames: z.array(z.string()).min(1).max(2),
  estimatedDurationMinutes: z.number().positive(),
  transcriptExcerpt: z.string().optional(),
  summary: z.string().optional(),
});

export type AudioSegmentPlan = z.infer<typeof audioSegmentPlanSchema>;

export const audioDirectionSchema = z.object({
  mode: z.enum(["single_speaker", "multi_speaker"]),
  targetDurationMinutes: z.number().positive(),
  estimatedWordCount: z.number().int().positive().optional(),
  language: z.string(),
  speakers: z.array(audioSpeakerSchema).min(1),
  ttsPrompt: z.preprocess(coerceTtsPrompt, z.string().min(1)),
  transcript: z.string(),
  segments: z.array(audioSegmentPlanSchema).optional(),
});

export type AudioDirection = z.infer<typeof audioDirectionSchema>;

export const creationAudioMetadataSchema = z.object({
  format: z.enum(["podcast", "audiobook"]),
  targetDurationMinutes: z.number().positive(),
  actualDurationMinutes: z.number().positive().optional(),
  ttsModel: z.string().optional(),
  segmentCount: z.number().int().nonnegative().optional(),
});

export type CreationAudioMetadata = z.infer<typeof creationAudioMetadataSchema>;

export const visualThemeSchema = z.object({
  mood: z.enum([
    "calm",
    "peaceful",
    "adventure",
    "horror",
    "mysterious",
    "joyful",
    "dramatic",
    "cozy",
    "energetic",
    "neutral",
  ]),
  energy: z.number().min(0).max(1),
  colors: z.tuple([z.string(), z.string(), z.string()]),
  ambience: z
    .enum(["none", "rain", "fog", "particles", "liquid", "space", "warm-glow"])
    .optional(),
  visualStyle: z
    .enum(["gradient", "liquid", "mesh", "minimal", "r3f"])
    .default("mesh"),
});

export type VisualTheme = z.infer<typeof visualThemeSchema>;

export const transcriptWordSchema = z.object({
  text: z.string(),
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().nonnegative(),
});

export const audioManifestSegmentSchema = z.object({
  segmentId: z.string(),
  sequence: z.number().int().nonnegative(),
  audioAssetId: z.string().uuid(),
  durationSeconds: z.number().nonnegative(),
  speakerNames: z.array(z.string()),
  title: z.string().optional(),
  transcript: z.string().optional(),
  words: z.array(transcriptWordSchema).optional(),
});

export const audioManifestSchema = z.object({
  version: z.literal(1),
  format: z.enum(["podcast", "audiobook"]),
  title: z.string().min(1),
  targetDurationMinutes: z.number().positive(),
  actualDurationMinutes: z.number().nonnegative(),
  language: z.string(),
  coverAssetId: z.string().uuid().optional(),
  speakers: z.array(
    z.object({
      name: z.string(),
      voice: z.string(),
      role: z.string(),
    }),
  ),
  segments: z.array(audioManifestSegmentSchema),
  finalAudioAssetId: z.string().uuid().optional(),
  transcript: z.string().optional(),
  visualTheme: visualThemeSchema.optional(),
});

export type AudioManifest = z.infer<typeof audioManifestSchema>;

export const bookPageLayoutSchema = z.enum([
  "title",
  "text_with_hero",
  "text_with_inline",
  "text_only",
]);

export const bookBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), text: z.string() }),
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({
    type: z.literal("illustration"),
    slotId: z.string(),
    assetId: z.string().uuid(),
    placement: z.enum(["hero", "inline"]),
    caption: z.string().optional(),
    altText: z.string(),
    status: z.enum(["ready", "failed"]).optional(),
  }),
]);

export type BookBlock = z.infer<typeof bookBlockSchema>;

export const bookPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  layout: bookPageLayoutSchema,
  blocks: z.array(bookBlockSchema),
});

export type BookPage = z.infer<typeof bookPageSchema>;

export const bookManifestSchema = z.object({
  version: z.literal(1),
  format: z.literal("illustrated_book"),
  title: z.string().min(1),
  pageCount: z.number().int().positive(),
  audience: z.enum(["kids", "teen", "adult"]),
  coverAssetId: z.string().uuid().optional(),
  pages: z.array(bookPageSchema),
  visualTheme: visualThemeSchema.optional(),
});

export type BookManifest = z.infer<typeof bookManifestSchema>;

export const illustrationSlotTypeSchema = z.enum([
  "illustration",
  "explanation",
  "diagram",
]);

export const storyPlanSlotSchema = z.object({
  slotId: z.string(),
  type: illustrationSlotTypeSchema,
  briefHint: z.string(),
});

export const storyPlanPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  layout: bookPageLayoutSchema,
  summary: z.string(),
  slots: z.array(storyPlanSlotSchema),
});

export const storyPlanSchema = z.object({
  title: z.string().min(1),
  pageCount: z.number().int().positive(),
  audience: z.enum(["kids", "teen", "adult"]),
  illustrationStyle: z.string(),
  characterBible: z.string(),
  pages: z.array(storyPlanPageSchema),
});

export type StoryPlan = z.infer<typeof storyPlanSchema>;

export const audioPlanSchema = z.object({
  title: z.string().min(1),
  format: z.enum(["podcast", "audiobook"]),
  targetDurationMinutes: z.number().positive(),
  estimatedWordCount: z.number().int().positive(),
  language: z.string(),
  mode: z.enum(["single_speaker", "multi_speaker"]),
  speakers: z.array(audioSpeakerSchema).min(1),
  segments: z.array(audioSegmentPlanSchema).optional(),
});

export type AudioPlan = z.infer<typeof audioPlanSchema>;

export const writtenPageSlotSchema = z.object({
  slotId: z.string(),
  type: illustrationSlotTypeSchema,
  illustrationBrief: z.string(),
  altText: z.string(),
  caption: z.string().nullable().optional(),
});

export const writtenPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  layout: bookPageLayoutSchema,
  heading: z.string().nullable().optional(),
  paragraphs: z.array(z.string()),
  slots: z.array(writtenPageSlotSchema),
});

export const writtenStorySchema = z.object({
  pages: z.array(writtenPageSchema),
});

export type WrittenPage = z.infer<typeof writtenPageSchema>;

export const slotAssetRecordSchema = z.object({
  assetId: z.string().uuid(),
  storagePath: z.string(),
  status: z.enum(["ready", "failed"]),
});

export const segmentAssetRecordSchema = z.object({
  segmentId: z.string(),
  assetId: z.string().uuid(),
  storagePath: z.string(),
  durationSeconds: z.number().nonnegative(),
});

export const webResearchCitationSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

export const pipelineCheckpointSchema = z.object({
  referenceContext: z.string().optional(),
  webResearchContext: z.string().optional(),
  webResearchAsOf: z.string().optional(),
  webResearchCitations: z.array(webResearchCitationSchema).optional(),
  storyPlan: storyPlanSchema.optional(),
  writtenPages: z.array(writtenPageSchema).optional(),
  slotAssets: z.record(z.string(), slotAssetRecordSchema).optional(),
  coverAssetId: z.string().uuid().optional(),
  coverStoragePath: z.string().optional(),
  coverGenerationSkipped: z.boolean().optional(),
  coverGenerationError: z.string().optional(),
  audioPlan: audioPlanSchema.optional(),
  transcript: z.string().optional(),
  segmentTranscripts: z.record(z.string(), z.string()).optional(),
  audioDirection: audioDirectionSchema.optional(),
  segmentAssets: z.array(segmentAssetRecordSchema).optional(),
  masterAudioAssetId: z.string().uuid().optional(),
  masterAudioStoragePath: z.string().optional(),
});

export type PipelineCheckpoint = z.infer<typeof pipelineCheckpointSchema>;

export const creationGenerationMetadataSchema = z.object({
  version: z.literal(1),
  pipeline: z.object({
    status: pipelineStatusSchema,
    step: z.string().optional(),
    stepStartedAt: z.string().optional(),
    illustrationIndex: z.number().int().nonnegative().optional(),
    ttsSegmentIndex: z.number().int().nonnegative().optional(),
    textInteractionId: z.string().optional(),
    imageChatId: z.string().optional(),
    ttsInteractionId: z.string().optional(),
    ttsModel: z.string().optional(),
    completedAt: z.string().optional(),
    error: z.string().optional(),
  }),
  display: z.object({
    coverAssetId: z.string().uuid().optional(),
    coverUrl: z.string().url().optional(),
    illustrationCount: z.number().int().nonnegative().optional(),
    readingTimeMinutes: z.number().int().positive().optional(),
    excerpt: z.string().optional(),
    visualTheme: visualThemeSchema.optional(),
  }),
  story: z
    .object({
      characterBible: z.string().optional(),
      illustrationStyle: z.string().optional(),
      format: z.literal("illustrated_book"),
    })
    .optional(),
  audio: creationAudioMetadataSchema.optional(),
  audioDirection: audioDirectionSchema.optional(),
  checkpoint: pipelineCheckpointSchema.optional(),
});

export type CreationGenerationMetadata = z.infer<
  typeof creationGenerationMetadataSchema
>;

export function createInitialMetadata(): CreationGenerationMetadata {
  return {
    version: 1,
    pipeline: { status: "planning" },
    display: {},
  };
}
