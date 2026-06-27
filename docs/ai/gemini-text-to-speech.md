# Gemini Text-to-Speech (Interactions API)

Chrysty primary model: **`gemini-3.1-flash-tts-preview`**  
Fallback: **`gemini-2.5-flash-preview-tts`**

Official docs: https://ai.google.dev/gemini-api/docs/text-to-speech

> **Preview:** Gemini TTS is in Preview. TTS models accept text-only input and produce audio-only output.

TTS via Interactions API is for **exact text recitation with fine-grained style control** (podcasts, audiobooks). The Live API is for interactive, unstructured audio.

## Chrysty: smart TTS

TTS is not a dumb read-aloud step. The text model (`gemini-3.1-flash-lite`) reads user form data from `setup` jsonb, **chooses voices** from the catalog below, and **designs creative audio** with director's notes and inline tags. See [content-generation-plan.md](./content-generation-plan.md).

**Podcast and audiobook rules** (duration planning, voice selection, multi-speaker strategy, audio tags, director template): [audio-generation-rules.md](./audio-generation-rules.md)

## Single-speaker TTS

```javascript
import { GoogleGenAI } from "@google/genai";
import wav from "wav";

async function saveWaveFile(filename, pcmData, channels = 1, rate = 24000, sampleWidth = 2) {
  return new Promise((resolve, reject) => {
    const writer = new wav.FileWriter(filename, {
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });
    writer.on("finish", resolve);
    writer.on("error", reject);
    writer.write(pcmData);
    writer.end();
  });
}

async function synthesizeSingleSpeaker(input, voice = "Kore") {
  const client = new GoogleGenAI({});

  const interaction = await client.interactions.create({
    model: process.env.GEMINI_TTS_MODEL ?? "gemini-3.1-flash-tts-preview",
    input,
    response_format: { type: "audio" },
    generation_config: {
      speech_config: [{ voice }],
    },
  });

  const audioBuffer = Buffer.from(interaction.output_audio.data, "base64");
  await saveWaveFile("out.wav", audioBuffer);
  return interaction;
}
```

Retrieve audio via `interaction.output_audio` (last generated audio block).

## Multi-speaker TTS (up to 2 speakers)

Speaker names in the prompt must match `speech_config`:

```javascript
const prompt = `TTS the following conversation between Joe and Jane:
Joe: How's it going today Jane?
Jane: Not too bad, how about you?`;

const interaction = await client.interactions.create({
  model: "gemini-3.1-flash-tts-preview",
  input: prompt,
  response_format: { type: "audio" },
  generation_config: {
    speech_config: [
      { speaker: "Joe", voice: "Kore" },
      { speaker: "Jane", voice: "Puck" },
    ],
  },
});
```

## Control style with prompts

Single-speaker:

```
Say in a spooky whisper:
"By the pricking of my thumbs...
Something wicked this way comes"
```

Multi-speaker with per-speaker direction:

```
Make Speaker1 sound tired and bored, and Speaker2 sound excited and happy:

Speaker1: So... what's on the agenda today?
Speaker2: You're never going to guess!
```

## Two-step: generate transcript then synthesize

```javascript
const client = new GoogleGenAI({});

const transcriptInteraction = await client.interactions.create({
  model: "gemini-3.1-flash-lite",
  input:
    "Generate a short transcript (~100 words) like a podcast clip by excited herpetologists. Hosts: Dr. Anya and Liam.",
});

const ttsInteraction = await client.interactions.create({
  model: "gemini-3.1-flash-tts-preview",
  input: transcriptInteraction.output_text,
  response_format: { type: "audio" },
  generation_config: {
    speech_config: [
      { speaker: "Dr. Anya", voice: "Kore" },
      { speaker: "Liam", voice: "Puck" },
    ],
  },
});
```

For Chrysty, the text step should output structured **audio direction** (voices, tags, full director prompt) — not just raw transcript.

## Streaming (3.1 Flash TTS only)

```javascript
const stream = await client.interactions.create({
  model: "gemini-3.1-flash-tts-preview",
  input: "Say cheerfully: Have a wonderful day!",
  response_format: { type: "audio" },
  generation_config: {
    speech_config: [{ voice: "Kore" }],
  },
  stream: true,
});

for await (const event of stream) {
  if (event.event_type === "step.delta" && event.delta.type === "audio") {
    const audioBuffer = Buffer.from(event.delta.data, "base64");
    // Process chunk
  }
}
```

Disable streaming when falling back to `gemini-2.5-flash-preview-tts`.

## TTS fallback

```javascript
const TTS_PRIMARY = process.env.GEMINI_TTS_MODEL ?? "gemini-3.1-flash-tts-preview";
const TTS_FALLBACK = process.env.GEMINI_TTS_FALLBACK_MODEL ?? "gemini-2.5-flash-preview-tts";

async function createTtsInteraction(params) {
  try {
    return await client.interactions.create({ ...params, model: TTS_PRIMARY });
  } catch (error) {
    if (isModelUnavailable(error)) {
      return await client.interactions.create({ ...params, model: TTS_FALLBACK, stream: false });
    }
    throw error;
  }
}
```

Log `metadata.ttsModel` on the creation record.

## Voice options (30)

| Voice | Style | Voice | Style |
|-------|-------|-------|-------|
| Zephyr | Bright | Puck | Upbeat |
| Charon | Informative | Kore | Firm |
| Fenrir | Excitable | Leda | Youthful |
| Orus | Firm | Aoede | Breezy |
| Callirrhoe | Easy-going | Autonoe | Bright |
| Enceladus | Breathy | Iapetus | Clear |
| Umbriel | Easy-going | Algieba | Smooth |
| Despina | Smooth | Erinome | Clear |
| Algenib | Gravelly | Rasalgethi | Informative |
| Laomedeia | Upbeat | Achernar | Soft |
| Alnilam | Firm | Schedar | Even |
| Gacrux | Mature | Pulcherrima | Forward |
| Achird | Friendly | Zubenelgenubi | Casual |
| Vindemiatrix | Gentle | Sadachbia | Lively |
| Sadaltager | Knowledgeable | Sulafat | Warm |

Try voices in [Google AI Studio Voice Library](https://aistudio.google.com/).

## Supported TTS models

| Model | Single speaker | Multispeaker |
|-------|----------------|--------------|
| **gemini-3.1-flash-tts-preview** | Yes | Yes |
| gemini-2.5-flash-preview-tts | Yes | Yes |
| gemini-2.5-pro-preview-tts | Yes | Yes |

## Prompting structure

Build prompts as a **director's brief**:

1. **Audio Profile** — character name, role, archetype
2. **Scene** — physical environment, mood, vibe
3. **Director's Notes** — style, accent, pacing (don't overspecify)
4. **Sample Context** — where this performance fits
5. **Transcript** — text to speak, with **audio tags**

### Audio tags

Inline modifiers for delivery. Use English tags even for non-English transcripts.

| Tags | | |
|------|---|---|
| `[excitedly]` | `[whispers]` | `[laughs]` |
| `[sighs]` | `[gasp]` | `[serious]` |
| `[shouting]` | `[tired]` | `[sarcastic]` |
| `[trembling]` | `[mischievously]` | `[very slow]` |

Example:

```
[excitedly] Welcome back to the show! [whispers] But first, a secret...
[shouting] Breaking news just dropped!
```

### Example full prompt

```
# AUDIO PROFILE: Jaz R.
## "The Morning Hype"

## THE SCENE: The London Studio
It is 10:00 PM in a glass-walled studio overlooking the moonlit London skyline.
The red "ON AIR" light is blazing. High energy, caffeine-fueled.

### DIRECTOR'S NOTES
Style: Vocal smile — bright, inviting tone. High projection without shouting.
Pace: Fast, bouncing cadence. No dead air.
Accent: Brixton, London

#### TRANSCRIPT
[excitedly] Yes, massive vibes in the studio! You are locked in and it is
absolutely popping off in London right now.
```

Align transcript tone with selected voice — mismatch causes poor output (especially on 3.1 Flash TTS).

## Limitations

- Text in, audio out only (32k token context)
- Chunk outputs longer than a few minutes; concatenate WAV server-side
- Retry on occasional 500 errors (random text token returns)
- Vague prompts may hit `PROHIBITED_CONTENT` — include clear "synthesize speech" preamble
- Voice inconsistency if prompt tone conflicts with selected voice profile

## PCM / WAV format

Output is base64 PCM: **24000 Hz, 16-bit, mono**. Use the `wav` npm package to wrap as `.wav` before uploading to `content-uploads` as `asset_type: "audio"`.

## Chrysty usage

See [content-generation-plan.md](./content-generation-plan.md) for form → voice selection, podcast multi-speaker, and asset storage. Podcast/audiobook-specific rules: [audio-generation-rules.md](./audio-generation-rules.md).
