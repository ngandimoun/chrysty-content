# Gemini Image Generation (Nano Banana)

Chrysty default model: **`gemini-3.1-flash-image`** (Nano Banana 2)

API surface: **`generateContent`** (`ai.models.generateContent`) — not Interactions API.

Official docs: https://ai.google.dev/gemini-api/docs/image-generation

## Nano Banana models

| Name | Model ID | Use case |
|------|----------|----------|
| **Nano Banana 2** | **`gemini-3.1-flash-image`** | Default — speed, cost, high volume (Chrysty) |
| Nano Banana Pro | `gemini-3-pro-image-preview` | Complex instructions, 4K, search grounding |
| Nano Banana | `gemini-2.5-flash-image` | Low latency, 1024px |

Google docs may reference `gemini-3.1-flash-image-preview` — same Nano Banana 2 family.

All generated images include a [SynthID watermark](https://ai.google.dev/responsible/docs/safeguards/synthid).

## Chrysty image use cases

| Use case | Output |
|----------|--------|
| **Card cover art** | One `cover` asset per creation; replaces CSS gradient on cards |
| **In-story illustrations** | Per-page/scene images with `metadata.pageNumber` |
| **Magazine-style story** | Sequential panel/spread images (image-primary narrative) |

See [content-generation-plan.md](./content-generation-plan.md).

## Text-to-image

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({});

const prompt =
  "A whimsical illustrated book cover for a children's bedtime story about a moonlit garden. Soft watercolor style, warm colors, no text.";

const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image",
  contents: prompt,
  config: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
      aspectRatio: "3:4",
      imageSize: "1K",
    },
  },
});

for (const part of response.candidates[0].content.parts) {
  if (part.text) {
    console.log(part.text);
  } else if (part.inlineData) {
    const buffer = Buffer.from(part.inlineData.data, "base64");
    fs.writeFileSync("cover.png", buffer);
  }
}
```

**Card covers:** use `aspectRatio: "3:4"` or `"4:5"`, `imageSize: "1K"`, `responseModalities: ["Image"]` when text is not needed.

## Image editing (text + image)

```javascript
const imageData = fs.readFileSync("path/to/reference.png");
const base64Image = imageData.toString("base64");

const prompt = [
  {
    text: "Using the provided illustration, add fireflies glowing around the trees. Match the soft watercolor style.",
  },
  {
    inlineData: {
      mimeType: "image/png",
      data: base64Image,
    },
  },
];

const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image",
  contents: prompt,
  config: { responseModalities: ["TEXT", "IMAGE"] },
});
```

## Multi-turn image editing (chat)

Recommended for iterating on covers and illustrations:

```javascript
const chat = ai.chats.create({
  model: "gemini-3.1-flash-image",
  config: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio: "3:4", imageSize: "1K" },
  },
});

let response = await chat.sendMessage({
  message: "Create a magazine-style comic panel: a robot discovering a hidden garden. Gritty noir ink style.",
});

// Follow-up edit
response = await chat.sendMessage({
  message: "Add more contrast and make the robot's eyes glow blue. Keep everything else the same.",
});
```

Store chat session or last response in `content_creations.metadata.imageChatId` for continuation.

## Configuration

### Response modalities

```javascript
config: {
  responseModalities: ["Image"], // image only, no text
}
```

### Aspect ratios and resolution

```javascript
config: {
  imageConfig: {
    aspectRatio: "3:4",  // good for Chrysty card covers
    imageSize: "1K",       // "512" | "1K" | "2K" | "4K" (uppercase K required)
  },
}
```

**3.1 Flash Image aspect ratios:** `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9`

### Reference images

Up to **14 reference images** per request (3.1 Flash Image):

- Up to 10 object reference images
- Up to 4 character reference images (character consistency across story pages)

Pass multiple `inlineData` parts alongside the text prompt.

### Google Search grounding

For news podcasts or real-time topics:

```javascript
config: {
  responseModalities: ["TEXT", "IMAGE"],
  tools: [{ googleSearch: {} }],
  imageConfig: { aspectRatio: "16:9" },
}
```

Image Search grounding (3.1 Flash Image only):

```javascript
tools: [{
  googleSearch: {
    searchTypes: { webSearch: {}, imageSearch: {} },
  },
}],
```

### Thinking (3.x image models)

Thinking is enabled by default. Interim thought images may appear with `part.thought === true` — skip these when saving final assets.

```javascript
config: {
  thinkingConfig: {
    thinkingLevel: "minimal", // or "high" on 3.1 Flash Image
    includeThoughts: false,
  },
}
```

## Other generation modes

- **Interleaved text + images:** e.g. "Generate an illustrated recipe with step images"
- **Comic / storyboard:** "Make a 3 panel comic in a gritty noir art style" — use for magazine-style stories
- **Batch API:** higher limits, up to 24h turnaround — for bulk illustration generation

## Prompting guide

> **Describe the scene, don't just list keywords.** Narrative paragraphs produce better results than tag lists.

### Templates

**Photorealistic:**

```
A photorealistic [shot type] of [subject], [action], set in [environment].
Illuminated by [lighting], [mood] atmosphere. [Camera/lens details].
[Aspect ratio].
```

**Stylized illustration / sticker:**

```
A [style] illustration of [subject], featuring [characteristics] and [color palette].
[Line/shading style]. Background: [description].
```

**Accurate text in images** (titles on covers — use Pro for best results):

```
Create a [image type] for [concept] with the text "[text]" in [font style].
[style description], [color scheme].
```

**Sequential art / comic panel:**

```
Make a [N] panel comic in a [style]. [Scene description].
[Character consistency notes if using reference images].
```

**Minimalist cover (negative space for UI overlay):**

```
A minimalist composition with [subject] in [corner]. Vast empty [color] canvas,
significant negative space. Soft diffused lighting. [Aspect ratio].
```

### Best practices

- Be hyper-specific about style, lighting, and intent
- Provide context: "cover for a kids bedtime story app" vs generic "illustration"
- Iterate conversationally via chat for refinement
- Use step-by-step instructions for complex multi-element scenes
- Control camera: `wide-angle shot`, `macro`, `low-angle perspective`

## Limitations

- No audio or video inputs for image generation
- Model may not follow exact image count requests
- `gemini-2.5-flash-image`: best with up to 3 input images
- `gemini-3.1-flash-image`: up to 4 character + 10 object references
- For text in images: generate text content first, then request image with that text
- Image Search grounding cannot search for people
- Language support: EN and many others (see official docs)

## Model selection

| Need | Model |
|------|-------|
| Chrysty covers, illustrations, magazine pages | `gemini-3.1-flash-image` |
| Professional 4K assets, complex typography | `gemini-3-pro-image-preview` |
| High-volume low-latency | `gemini-2.5-flash-image` |

## Imagen (alternative)

[Imagen](https://ai.google.dev/gemini-api/docs/imagen) is a separate specialized image model accessible via Gemini API. Chrysty uses Nano Banana (`gemini-3.1-flash-image`) as primary; `FAL_KEY` in env is optional fallback only.

## Chrysty pipeline

1. Text model produces scene list / cover brief from `setup` jsonb
2. Image model generates cover + per-page illustrations
3. Upload PNG/WebP to Supabase `content-uploads` via `uploadCreationAsset({ assetType: "cover" })`

See [content-generation-plan.md](./content-generation-plan.md).
