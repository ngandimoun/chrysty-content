# Gemini Interactions API

Reference for the recommended Gemini interface (GA as of June 2026). Chrysty uses this for **text** and **TTS**; images use `generateContent` (see [gemini-image-generation.md](./gemini-image-generation.md)).

Official docs: https://ai.google.dev/gemini-api/docs/interactions-overview

## Why use the Interactions API?

- **New capabilities**: Server-side conversation state (`previous_interaction_id`), observable execution steps, background execution (`background=true`).
- **Lower cost**: Server-side state enables efficient context caching across turns.
- **Built for agents**: Purpose-built for thinking models, multi-step tool use, and complex reasoning.
- **Single API for models and agents**: One interface for Gemini models and agents (Deep Research, etc.).
- **Where new things launch**: New models and agentic capabilities launch here first.

Legacy [`generateContent`](https://ai.google.dev/gemini-api/docs/generate-content/text-generation) remains supported but is not the primary path for new Chrysty text/TTS work.

## Core resource: Interaction

An **Interaction** represents a complete turn in a conversation or task. It contains a chronological sequence of **execution steps**: model thoughts, tool calls/results, and final `model_output`. Stored resources (via `interactions.get`) include `user_input` steps for full context; `interactions.create` responses return model-generated steps only.

## Server-side state management

Use the `id` of a completed interaction in a subsequent call with `previous_interaction_id` to continue the conversation without resending full history.

**Preserved via `previous_interaction_id`:** conversation history (inputs and outputs).

**Interaction-scoped (must re-specify each turn):**

- `tools`
- `system_instruction`
- `generation_config` (including `thinking_level`, `temperature`, etc.)

Stateless mode: send full conversation history in `input` and set `store=false`.

## Data storage and retention

By default `store=true` (required for `previous_interaction_id` and background execution).

| Tier | Retention |
|------|-----------|
| Paid | 55 days |
| Free | 1 day |

Set `store=false` to opt out. Incompatible with background execution and `previous_interaction_id` for subsequent turns.

Delete stored interactions via the [API delete method](https://ai.google.dev/api/interactions-api) when you know the interaction ID.

## SDK requirements

| Language | Package | Minimum version |
|----------|---------|-----------------|
| JavaScript / TypeScript | `@google/genai` | 2.3.0 |
| Python | `google-genai` | 2.3.0 |

Install: https://ai.google.dev/gemini-api/docs/libraries

## Supported models and agents

| Model Name | Type | Model ID |
|---|---|---|
| Gemini 3.5 Flash | Model | `gemini-3.5-flash` |
| Gemini 3.1 Pro Preview | Model | `gemini-3.1-pro-preview` |
| **Gemini 3.1 Flash-Lite** | Model | **`gemini-3.1-flash-lite`** ← Chrysty text |
| Gemini 3 Flash Preview | Model | `gemini-3-flash-preview` |
| Gemini 2.5 Pro | Model | `gemini-2.5-pro` |
| Gemini 2.5 Flash | Model | `gemini-2.5-flash` |
| Gemini 2.5 Flash-lite | Model | `gemini-2.5-flash-lite` |
| **Gemini 3 Pro Image** | Model | `gemini-3-pro-image` |
| **Gemini 3.1 Flash Image** | Model | **`gemini-3.1-flash-image`** ← Chrysty images (via generateContent) |
| **Gemini 3.1 Flash TTS Preview** | Model | **`gemini-3.1-flash-tts-preview`** ← Chrysty TTS |
| Gemma 4 31B IT | Model | `gemma-4-31b-it` |
| Gemma 4 26B MoE IT | Model | `gemma-4-26b-a4b-it` |
| Lyria 3 Clip Preview | Model | `lyria-3-clip-preview` |
| Lyria 3 Pro Preview | Model | `lyria-3-pro-preview` |
| Deep Research Preview | Agent | `deep-research-preview-04-2026` |
| Deep Research Preview | Agent | `deep-research-max-preview-04-2026` |
| Antigravity Preview | Agent | `antigravity-preview-05-2026` |

## Best practices

- **Cache hit rate**: Use `previous_interaction_id` for multi-turn conversations.
- **Mixing interactions**: Chain Agent and Model interactions via `previous_interaction_id` (e.g. Deep Research → summarization).

## Limitations (Interactions API)

Not yet available in Interactions API (use `generateContent` instead):

- Video metadata (clipping, custom frame rates)
- Batch API
- Automatic function calling (Python)
- Explicit caching (implicit caching via `previous_interaction_id` is available)

Remote MCP: Gemini 3 does not support remote MCP (coming soon).

## Feature guides

- [Text generation](./gemini-text-generation.md) (Interactions)
- [Image generation](./gemini-image-generation.md) (generateContent)
- [Text-to-speech](./gemini-text-to-speech.md) (Interactions)
- [Streaming interactions](https://ai.google.dev/gemini-api/docs/streaming)
- [Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Background execution](https://ai.google.dev/gemini-api/docs/background-execution)
- [Migration from generateContent](https://ai.google.dev/gemini-api/docs/migrate-to-interactions)

## Chrysty implementation

See [content-generation-plan.md](./content-generation-plan.md) for how Interactions API maps to `content_creations`, assets, and pipelines.
