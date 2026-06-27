# Content Metadata Schema

Unified metadata contract for generated content: **creations**, **assets**, and the **Book Manifest** (story reader source of truth).

TypeScript types: [`src/types/content-metadata.ts`](../../src/types/content-metadata.ts)

Story generation rules: [story-generation-rules.md](./story-generation-rules.md)

Audio generation rules (podcast / audiobook): [audio-generation-rules.md](./audio-generation-rules.md)

## Overview

| Layer | Storage | Purpose |
|-------|---------|---------|
| Creation | `content_creations.metadata` | Pipeline state, display fields for cards, story/audio context |
| Asset | `content_creation_assets.metadata` | Role, page/slot/segment linkage, a11y, regeneration hints |
| Book Manifest | `content_creation_assets` (`asset_type: script`, `role: book_manifest`) | Ordered pages and blocks for story reader UI |
| Audio Manifest | `content_creation_assets` (`asset_type: script`, `role: audio_manifest`) | Segments and playback info for podcast/audiobook UI |

Every generated asset **must** include `metadata` with at least `role` and `altText` (except script JSON where `role: book_manifest`).

## Creation metadata

Stored on `content_creations.metadata` (jsonb).

### TypeScript shape

```typescript
interface CreationGenerationMetadata {
  version: 1;
  pipeline: {
    status: "planning" | "writing" | "illustrating" | "composing" | "completed" | "failed";
    textInteractionId?: string;
    imageChatId?: string;
    ttsInteractionId?: string;
    ttsModel?: string;
    completedAt?: string;
    error?: string;
  };
  display: {
    coverAssetId?: string;
    coverUrl?: string;
    illustrationCount?: number;
    readingTimeMinutes?: number;
    excerpt?: string;
  };
  story?: {
    characterBible?: string;
    illustrationStyle?: string;
    format: "illustrated_book";
  };
  audio?: CreationAudioMetadata;
  audioDirection?: AudioDirection;
}
```

### Example (completed story)

```json
{
  "version": 1,
  "pipeline": {
    "status": "completed",
    "textInteractionId": "int_abc123",
    "imageChatId": "chat_xyz789",
    "completedAt": "2026-06-27T14:30:00.000Z"
  },
  "display": {
    "coverAssetId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "coverUrl": "https://storage.example/content-uploads/ck_xxx/creation-id/cover.png",
    "illustrationCount": 8,
    "readingTimeMinutes": 12,
    "excerpt": "Luna pressed her ear to the garden gate and heard the flowers whisper her name..."
  },
  "story": {
    "characterBible": "Luna: 7-year-old girl, curly brown hair, yellow raincoat. Setting: suburban backyard, magical hidden garden.",
    "illustrationStyle": "Soft watercolor children's book with warm pastels",
    "format": "illustrated_book"
  }
}
```

## Asset metadata

Stored on `content_creation_assets.metadata` (jsonb). Required on all AI-generated assets.

### TypeScript shape

```typescript
interface AssetMetadata {
  role:
    | "card_cover"
    | "title_hero"
    | "illustration"
    | "explanation"
    | "diagram"
    | "book_manifest"
    | "audio_manifest"
    | "story_plan"
    | "audio_plan"
    | "script"
    | "audio"
    | "narration";
  pageNumber?: number;
  slotId?: string;
  sequence?: number;
  altText: string;
  caption?: string;
  prompt?: string;
  model?: string;
  aspectRatio?: string;
  status?: "ready" | "failed";
}
```

### Asset type vs role

| `asset_type` (DB column) | Typical `metadata.role` |
|--------------------------|-------------------------|
| `cover` | `card_cover` |
| `illustration` | `illustration`, `explanation`, `diagram`, `title_hero` |
| `script` | `book_manifest`, `audio_manifest`, `story_plan`, `audio_plan`, `script` |
| `audio` | `audio`, `narration` |
| `source` | User uploads (legacy) |

### Example (in-story illustration)

```json
{
  "role": "illustration",
  "pageNumber": 3,
  "slotId": "illus_p3_s1",
  "sequence": 1,
  "altText": "Luna standing at an ivy-covered garden gate under moonlight",
  "caption": "The gate had waited years for someone to listen.",
  "prompt": "Soft watercolor children's book. Luna, 7-year-old girl with curly brown hair and yellow raincoat, standing before an ivy-covered garden gate at night, moonlight, warm pastels.",
  "model": "gemini-3.1-flash-image",
  "aspectRatio": "4:3",
  "status": "ready"
}
```

### Example (cover)

```json
{
  "role": "card_cover",
  "altText": "Cover illustration of Luna discovering a glowing moonlit garden",
  "prompt": "Book cover art, soft watercolor, Luna in yellow raincoat surrounded by glowing flowers at night, no text, 3:4 portrait",
  "model": "gemini-3.1-flash-image",
  "aspectRatio": "3:4",
  "status": "ready"
}
```

## Book Manifest

The **source of truth** for the story reader UI. One manifest per story creation.

| Property | Value |
|----------|-------|
| `asset_type` | `script` |
| `mime_type` | `application/json` |
| `metadata.role` | `book_manifest` |

### TypeScript shape

```typescript
interface BookManifest {
  version: 1;
  format: "illustrated_book";
  title: string;
  pageCount: number;
  audience: "kids" | "teen" | "adult";
  coverAssetId: string;
  pages: BookPage[];
}

interface BookPage {
  pageNumber: number;
  layout: "title" | "text_with_hero" | "text_with_inline" | "text_only";
  blocks: BookBlock[];
}

type BookBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | {
      type: "illustration";
      slotId: string;
      assetId: string;
      placement: "hero" | "inline";
      caption?: string;
      altText: string;
      status?: "ready" | "failed";
    };
```

### Example (abbreviated)

```json
{
  "version": 1,
  "format": "illustrated_book",
  "title": "The Moonlit Garden",
  "pageCount": 10,
  "audience": "kids",
  "coverAssetId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "pages": [
    {
      "pageNumber": 1,
      "layout": "title",
      "blocks": [
        { "type": "heading", "text": "The Moonlit Garden" },
        {
          "type": "illustration",
          "slotId": "illus_p1_s1",
          "assetId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          "placement": "hero",
          "altText": "Luna discovering glowing flowers at night",
          "status": "ready"
        }
      ]
    },
    {
      "pageNumber": 2,
      "layout": "text_with_inline",
      "blocks": [
        { "type": "paragraph", "text": "Luna pressed her ear to the cold iron gate..." },
        {
          "type": "illustration",
          "slotId": "illus_p2_s1",
          "assetId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
          "placement": "inline",
          "caption": "The gate had waited years for someone to listen.",
          "altText": "Ivy-covered garden gate under moonlight",
          "status": "ready"
        },
        { "type": "paragraph", "text": "The whispers grew louder, like wind through petals." }
      ]
    }
  ]
}
```

## UI mapping

| UI surface | Data source |
|------------|-------------|
| Library card image | `metadata.display.coverUrl` or resolve `display.coverAssetId` |
| Card subtitle / excerpt | `metadata.display.excerpt` or `content_creations.description` |
| Page count badge | `content_creations.page_count` or `manifest.pageCount` |
| Reading time | `metadata.display.readingTimeMinutes` |
| Story reader | Book Manifest `pages[].blocks` + asset URLs resolved by `assetId` |
| Audio player (podcast/audiobook) | Audio Manifest `segments` + `finalAudioAssetId` or segment URLs |
| Duration badge (audio) | `content_creations.duration_minutes` or `metadata.audio.actualDurationMinutes` |
| Progress while generating | `metadata.pipeline.status` + `content_creations.generation_progress` |
| Consumption progress | `content_consumption_progress` joined by `content_key` or `user_id` |
| Gradient fallback | `artwork_gradient` when `coverUrl` is absent |

## Consumption & lifecycle

Generation and consumption are **separate**:

| Layer | Column / table | Purpose |
|-------|----------------|---------|
| Generation | `content_creations.generation_progress` (0–100) | Pipeline only |
| Generation status | `content_creations.status` | `draft`, `generating`, `completed`, `failed`, `archived` |
| Consumption | `content_consumption_progress` | Per-user or per-`content_key` reading/listening state |
| Events | `content_consumption_events` | Immutable engagement log |
| Annotations | `content_consumption_annotations` | Bookmarks, highlights, notes, quotes |

Types: [`src/types/consumption.ts`](../../src/types/consumption.ts)

### Consumption status

`not_started` | `in_progress` | `completed` | `abandoned` (derived when `in_progress` + stale `last_opened_at`)

### Resume context (`resume_context` jsonb)

```typescript
interface ResumeContext {
  sectionIndex?: number;
  sectionTitle?: string;
  excerpt?: string;
  summary?: string; // cached AI resume line
}
```

### Identity

- Anonymous: rows keyed by `content_key`
- Signed in: rows keyed by `user_id`; anonymous rows merge on sign-in via `POST /api/auth/merge`

### APIs

| Route | Purpose |
|-------|---------|
| `PATCH /api/creations/[id]/consumption` | Save position, time spent, completion |
| `POST /api/creations/[id]/events` | Batch consumption events |
| `GET/POST/DELETE /api/creations/[id]/annotations` | Bookmarks & highlights |
| `GET /api/creations/collections` | Auto shelves |
| `GET /api/profile/stats` | Aggregated stats |
| `POST /api/creations/[id]/assistant` | AI chat + resume summary |

## Audio direction and creation audio metadata

Stored at `content_creations.metadata.audioDirection` (full TTS brief) and `metadata.audio` (summary for UI).

### TypeScript shapes

```typescript
interface CreationAudioMetadata {
  format: "podcast" | "audiobook";
  targetDurationMinutes: number;
  actualDurationMinutes?: number;
  ttsModel?: string;
  segmentCount?: number;
}

interface AudioDirection {
  mode: "single_speaker" | "multi_speaker";
  targetDurationMinutes: number;
  estimatedWordCount?: number;
  language: string;
  speakers: Array<{
    name: string;
    voice: string;
    role: string;
    audioProfile?: string;
  }>;
  ttsPrompt: string;
  transcript: string;
  segments?: AudioSegmentPlan[];
}

interface AudioSegmentPlan {
  segmentId: string;
  speakerNames: string[];  // max 2 per TTS call
  estimatedDurationMinutes: number;
  transcriptExcerpt?: string;
  summary?: string;
}
```

### Example (completed podcast)

```json
{
  "version": 1,
  "pipeline": {
    "status": "completed",
    "textInteractionId": "int_pod_001",
    "ttsInteractionId": "int_tts_001",
    "completedAt": "2026-06-27T16:00:00.000Z"
  },
  "display": {
    "coverAssetId": "d4e5f6a7-b8c9-0123-def0-123456789abc",
    "coverUrl": "https://storage.example/content-uploads/ck_xxx/podcast/cover.png",
    "excerpt": "This week: the breakthrough that changed everything about how we build with AI..."
  },
  "audio": {
    "format": "podcast",
    "targetDurationMinutes": 10,
    "actualDurationMinutes": 9,
    "ttsModel": "gemini-3.1-flash-tts-preview",
    "segmentCount": 2
  },
  "audioDirection": {
    "mode": "multi_speaker",
    "targetDurationMinutes": 10,
    "estimatedWordCount": 1500,
    "language": "en",
    "speakers": [
      { "name": "Maya", "voice": "Charon", "role": "host", "audioProfile": "Tech insider, warm and brisk" },
      { "name": "Jordan", "voice": "Puck", "role": "analyst", "audioProfile": "Enthusiastic co-host" }
    ],
    "ttsPrompt": "# AUDIO PROFILE: Maya Chen...",
    "transcript": "[excitedly] Maya: Welcome back...",
    "segments": [
      { "segmentId": "seg_01", "speakerNames": ["Maya", "Jordan"], "estimatedDurationMinutes": 4 },
      { "segmentId": "seg_02", "speakerNames": ["Maya", "Jordan"], "estimatedDurationMinutes": 6 }
    ]
  }
}
```

See [audio-generation-rules.md](./audio-generation-rules.md) and [gemini-text-to-speech.md](./gemini-text-to-speech.md).

## Audio Manifest

The **source of truth** for podcast/audiobook playback UI. One manifest per audio creation.

| Property | Value |
|----------|-------|
| `asset_type` | `script` |
| `mime_type` | `application/json` |
| `metadata.role` | `audio_manifest` |

### TypeScript shape

```typescript
interface AudioManifest {
  version: 1;
  format: "podcast" | "audiobook";
  title: string;
  targetDurationMinutes: number;
  actualDurationMinutes: number;
  language: string;
  coverAssetId: string;
  speakers: Array<{ name: string; voice: string; role: string }>;
  segments: Array<{
    segmentId: string;
    sequence: number;
    audioAssetId: string;
    durationSeconds: number;
    speakerNames: string[];
  }>;
  finalAudioAssetId?: string;
}
```

### Example

```json
{
  "version": 1,
  "format": "podcast",
  "title": "AI Breakthrough Weekly",
  "targetDurationMinutes": 10,
  "actualDurationMinutes": 9,
  "language": "en",
  "coverAssetId": "d4e5f6a7-b8c9-0123-def0-123456789abc",
  "speakers": [
    { "name": "Maya", "voice": "Charon", "role": "host" },
    { "name": "Jordan", "voice": "Puck", "role": "analyst" }
  ],
  "segments": [
    {
      "segmentId": "seg_01",
      "sequence": 0,
      "audioAssetId": "e5f6a7b8-c9d0-1234-ef01-234567890bcd",
      "durationSeconds": 240,
      "speakerNames": ["Maya", "Jordan"]
    },
    {
      "segmentId": "seg_02",
      "sequence": 1,
      "audioAssetId": "f6a7b8c9-d0e1-2345-f012-345678901cde",
      "durationSeconds": 300,
      "speakerNames": ["Maya", "Jordan"]
    }
  ],
  "finalAudioAssetId": "a7b8c9d0-e1f2-3456-0123-456789012def"
}
```

### Example (audio segment asset metadata)

```json
{
  "role": "audio",
  "segmentId": "seg_01",
  "sequence": 0,
  "altText": "Podcast segment 1: cold open and headline discussion",
  "durationSeconds": 240,
  "model": "gemini-3.1-flash-tts-preview",
  "status": "ready"
}
```

## Validation

Use Zod schemas from [`src/types/content-metadata.ts`](../../src/types/content-metadata.ts) at compose time (Phase 5) before persisting manifest and updating creation metadata.
