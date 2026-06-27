<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## AI generation

When working on content generation, read:

- [docs/ai/gemini-interactions-api.md](docs/ai/gemini-interactions-api.md)
- [docs/ai/gemini-text-generation.md](docs/ai/gemini-text-generation.md)
- [docs/ai/gemini-image-generation.md](docs/ai/gemini-image-generation.md)
- [docs/ai/gemini-text-to-speech.md](docs/ai/gemini-text-to-speech.md)
- [docs/ai/content-generation-plan.md](docs/ai/content-generation-plan.md)
- [docs/ai/story-generation-rules.md](docs/ai/story-generation-rules.md)
- [docs/ai/audio-generation-rules.md](docs/ai/audio-generation-rules.md)
- [docs/ai/content-metadata-schema.md](docs/ai/content-metadata-schema.md)

Model defaults:

- Text: Interactions API with `gemini-3.1-flash-lite`
- Images: `generateContent` with `gemini-3.1-flash-image`
- TTS: Interactions API with `gemini-3.1-flash-tts-preview`; fallback `gemini-2.5-flash-preview-tts` if unavailable

**Execution:** Step-based pipeline in `src/lib/ai/`. One step per `POST /api/creations/[id]/generate` call (`maxDuration=300`). Self-chains via `@vercel/functions` `waitUntil` + `GENERATION_INTERNAL_SECRET`. No Trigger.dev.

TTS must be smart: AI chooses voices from the 30-voice catalog based on `setup` form data and designs creative audio with tags — not static form-to-voice mapping.

Stories follow [story-generation-rules.md](docs/ai/story-generation-rules.md); output is a Book Manifest (`asset_type: script`, `role: book_manifest`).

Podcasts and audiobooks follow [audio-generation-rules.md](docs/ai/audio-generation-rules.md); output is an Audio Manifest. Duration, voices, tags, and multi-speaker design are AI-owned.

Do not expose `GEMINI_API_KEY` or `GENERATION_INTERNAL_SECRET` to the client.
