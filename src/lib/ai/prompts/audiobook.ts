import {
  jsonOutputRules,
  languageInstruction,
  referenceContextBlock,
  resolveSetupLabel,
  voiceCatalogForPrompt,
} from "./shared";

export function audiobookPlanSystemInstruction(): string {
  return `You are an audiobook production planner. You infer duration, pick Gemini TTS voices, and plan narration structure.
Available voices: ${voiceCatalogForPrompt()}.
${jsonOutputRules()}`;
}

export function audiobookPlanUserMessage(
  setup: Record<string, unknown>,
  referenceContext?: string,
): string {
  const language = String(setup.language ?? "en");
  const audiobookType = resolveSetupLabel(
    String(setup.audiobookType ?? ""),
    setup.audiobookTypeCustom as string | undefined,
  );
  const topicIdea = String(setup.topicIdea ?? "");
  const voiceStyle = resolveSetupLabel(
    String(setup.voiceStyle ?? ""),
    setup.voiceStyleCustom as string | undefined,
  );

  return `${languageInstruction(language)}

Plan an audiobook chapter/sample.

Type: ${audiobookType}
Topic: ${topicIdea}
Voice style hint: ${voiceStyle}

Duration rules (pick target within range based on topic depth):
- sample/chapter: 10-20 minutes
- bedtime_story type: 5-10 minutes
- default: 10-15 minutes

estimatedWordCount ≈ targetDurationMinutes × 150

IMPORTANT: targetDurationMinutes is the episode length in MINUTES (typically 5–20), NOT word count.
estimatedWordCount is a separate field for script length in words.

TTS segment rules:
- Split narration into segments of max ~3 minutes each (≈450 words per segment)
- Each segment gets a stable segmentId (seg_01, seg_02, …)

Output JSON:
{
  "title": string,
  "format": "audiobook",
  "targetDurationMinutes": number,
  "estimatedWordCount": number,
  "language": "${language}",
  "mode": "single_speaker",
  "speakers": [{ "name": string, "voice": string (from catalog), "role": "narrator", "audioProfile": string }],
  "segments": [{ "segmentId": string, "speakerNames": string[], "estimatedDurationMinutes": number (max 3), "summary": string }]
}${referenceContextBlock(referenceContext)}`;
}

export function audiobookDirectorUserMessage(input: {
  setup: Record<string, unknown>;
  audioPlanJson: string;
  referenceContext?: string;
}): string {
  const language = String(input.setup.language ?? "en");
  const voiceStyle = resolveSetupLabel(
    String(input.setup.voiceStyle ?? ""),
    input.setup.voiceStyleCustom as string | undefined,
  );

  return `${languageInstruction(language)}

Write the full tagged narration script AND build a complete AudioDirection JSON for TTS synthesis in one response.

Audio plan:
${input.audioPlanJson}

Voice style hint: ${voiceStyle}

Script rules:
- Use speaker label format: Narrator: line...
- Embed English audio tags at emotion shifts: [serious], [calm], [thoughtful], [excitedly], [sighs], etc.
- Prefer clear narration tags ([serious], [calm], [thoughtful]) — avoid sustained [whispers] or [very slow] which make TTS inaudible.
- For historical or educational topics: keep language factual and non-graphic; avoid gore, explicit violence, or sensationalized descriptions.
- Word count should approximate estimatedWordCount from the plan.
- If segments are defined in the plan, structure the transcript so each segment's lines flow naturally in order.
- Put the full script in the \`transcript\` field only — do NOT repeat it inside \`ttsPrompt\`.

Build ttsPrompt as ONE markdown string (not a nested JSON object). Use \\n between sections with this template:
# AUDIO PROFILE: {name} — "{archetype}"
## THE SCENE: {environment + vibe}
### DIRECTOR'S NOTES
Style / Pace / Accent / Language notes
### SAMPLE CONTEXT
{where this performance lives}

Keep director notes TTS-safe: educational tone, no graphic violence references.
Director notes should request clear, audible narration — avoid instructing whispers or very slow delivery throughout.

For multi-segment plans, include a \`segments\` array with \`transcriptExcerpt\` per segmentId.

Output JSON matching AudioDirection:
{
  "mode": "single_speaker",
  "targetDurationMinutes": number,
  "estimatedWordCount": number,
  "language": string,
  "speakers": [...],
  "ttsPrompt": string (single markdown string — director brief only, no transcript section),
  "transcript": string (full tagged script with Narrator: labels),
  "segments": [{ "segmentId": string, "speakerNames": string[], "estimatedDurationMinutes": number, "transcriptExcerpt": string, "summary": string }] optional
}${referenceContextBlock(input.referenceContext)}`;
}

export function audiobookCoverPrompt(input: {
  setup: Record<string, unknown>;
  title: string;
  referenceContext?: string;
}): string {
  const audiobookType = resolveSetupLabel(
    String(input.setup.audiobookType ?? ""),
    input.setup.audiobookTypeCustom as string | undefined,
  );
  const topicIdea = String(input.setup.topicIdea ?? "");

  return `Audiobook cover art for "${input.title}".
Genre: ${audiobookType}. Subject: ${topicIdea}.
Evocative, cinematic cover. No readable body text. Portrait 3:4.${referenceContextBlock(input.referenceContext)}`;
}
