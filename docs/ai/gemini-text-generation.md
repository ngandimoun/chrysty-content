# Gemini Text Generation (Interactions API)

Chrysty default model: **`gemini-3.1-flash-lite`**

Official docs: https://ai.google.dev/gemini-api/docs/text-generation

## Basic example

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const interaction = await ai.interactions.create({
  model: "gemini-3.1-flash-lite",
  input: "How does AI work?",
});

console.log(interaction.output_text);
```

`interaction.output_text` returns the last text blocks in the model response, joining consecutive text parts. For interleaved multimodal responses, iterate over steps manually.

## Thinking

Gemini models often have thinking enabled by default.

```javascript
const interaction = await ai.interactions.create({
  model: "gemini-3.1-flash-lite",
  input: "How does AI work?",
  generation_config: {
    thinking_level: "low",
  },
});
```

## System instructions and generation config

```javascript
const interaction = await ai.interactions.create({
  model: "gemini-3.1-flash-lite",
  input: "Hello there",
  system_instruction: "You are a creative writing assistant for children's stories.",
  generation_config: {
    temperature: 1.0,
  },
});
```

## Multimodal inputs

```javascript
const uploadedFile = await ai.files.upload({
  file: "path/to/image.jpg",
  config: { mimeType: "image/jpeg" },
});

const interaction = await ai.interactions.create({
  model: "gemini-3.1-flash-lite",
  input: [
    { type: "text", text: "Describe this image for a story cover brief" },
    {
      type: "image",
      uri: uploadedFile.uri,
      mime_type: uploadedFile.mimeType,
    },
  ],
});
```

## Streaming

```javascript
const stream = await ai.interactions.create({
  model: "gemini-3.1-flash-lite",
  input: "Write a short bedtime story outline",
  stream: true,
});

for await (const event of stream) {
  if (event.event_type === "step.delta") {
    if (event.delta.type === "text") {
      process.stdout.write(event.delta.text);
    }
  }
}
```

## Multi-turn conversations

```javascript
const interaction1 = await ai.interactions.create({
  model: "gemini-3.1-flash-lite",
  input: "I want a podcast about renewable energy for teens.",
});

const interaction2 = await ai.interactions.create({
  model: "gemini-3.1-flash-lite",
  input: "Make it a 5-minute intro segment with two hosts.",
  previous_interaction_id: interaction1.id,
});

console.log(interaction2.output_text);
```

Streaming works with `previous_interaction_id` as well.

## Stateless mode

```javascript
const history = [
  {
    type: "user_input",
    content: [{ type: "text", text: "Draft a story title about a lost robot." }],
  },
];

const interaction1 = await ai.interactions.create({
  model: "gemini-3.1-flash-lite",
  store: false,
  input: history,
});

history.push(...interaction1.steps);
history.push({
  type: "user_input",
  content: [{ type: "text", text: "Now write the opening paragraph." }],
});

const interaction2 = await ai.interactions.create({
  model: "gemini-3.1-flash-lite",
  store: false,
  input: history,
});
```

When using thinking or tools in stateless mode, preserve and resend all model-generated steps exactly as received.

## Chrysty usage

The text model is used for:

1. **Script generation** — stories, podcast transcripts, audiobook narration text
2. **Audio direction** — structured output with voice choices, director's notes, and tagged transcripts (see [gemini-text-to-speech.md](./gemini-text-to-speech.md))
3. **Image briefs** — scene descriptions fed to [gemini-image-generation.md](./gemini-image-generation.md)

Store `interaction.id` in `content_creations.metadata.textInteractionId` for multi-turn refinement.

See [content-generation-plan.md](./content-generation-plan.md) for the full pipeline.

## Prompting tips

Consult Google's [prompt engineering guide](https://ai.google.dev/gemini-api/docs/prompting-strategies) for best results.
