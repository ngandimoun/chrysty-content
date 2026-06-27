import {
  generationDateContext,
  jsonOutputRules,
  languageInstruction,
  referenceContextBlock,
  resolveSetupLabel,
  voiceCatalogForPrompt,
  webResearchContextBlock,
} from "./shared";

function durationHint(podcastType: string, participants?: string): string {
  if (podcastType === "news") return "3-5 minutes";
  if (podcastType === "solo") return "5-8 minutes";
  if (podcastType === "educational") return "8-12 minutes";
  if (podcastType === "interview" && participants === "host_guest")
    return "10-15 minutes";
  if (podcastType === "debate" || participants === "roundtable")
    return "12-18 minutes";
  if (podcastType === "storytelling") return "8-12 minutes";
  return "8-12 minutes";
}

export function podcastPlanSystemInstruction(): string {
  return `You are a podcast production planner. Pick duration, hosts, Gemini TTS voices, and segment structure.
Available voices: ${voiceCatalogForPrompt()}.
Max 2 speakers per TTS segment. For roundtable/debate with 3+ voices, split into segments with max 2 speakers each.
Do not use stale training-data timelines; prefer web research facts and today's date.
${jsonOutputRules()}`;
}

export function podcastPlanUserMessage(
  setup: Record<string, unknown>,
  referenceContext?: string,
  webResearchContext?: string,
  webResearchAsOf?: string,
): string {
  const language = String(setup.language ?? "en");
  const podcastType = resolveSetupLabel(
    String(setup.podcastType ?? ""),
    setup.podcastTypeCustom as string | undefined,
  );
  const topicIdea = String(setup.topicIdea ?? "");
  const participants = String(setup.participants ?? "one_host");
  const newsType = setup.newsType ? String(setup.newsType) : undefined;
  const subject = resolveSetupLabel(
    String(setup.subject ?? ""),
    setup.subjectCustom as string | undefined,
  );

  const mode =
    participants === "host_guest" ||
    participants === "roundtable" ||
    podcastType === "debate"
      ? "multi_speaker"
      : "single_speaker";

  return `${generationDateContext()}

${languageInstruction(language)}

Plan a podcast episode.

Type: ${podcastType}
Participants: ${participants}
Topic: ${topicIdea}
${newsType ? `News type: ${newsType}` : ""}
${subject ? `Subject: ${subject}` : ""}

Target duration: ${durationHint(podcastType, participants)}
estimatedWordCount ≈ targetDurationMinutes × 150

IMPORTANT: targetDurationMinutes is the episode length in MINUTES (typically 3–18), NOT word count.
estimatedWordCount is a separate field for script length in words.

TTS mode: ${mode}

For roundtable/debate: include segments array with max 2 speakerNames per segment.

Output JSON:
{
  "title": string,
  "format": "podcast",
  "targetDurationMinutes": number,
  "estimatedWordCount": number,
  "language": "${language}",
  "mode": "${mode}",
  "speakers": [{ "name": string, "voice": string, "role": string, "audioProfile": string }],
  "segments": [{ "segmentId": string, "speakerNames": string[], "estimatedDurationMinutes": number, "summary": string }]
}${referenceContextBlock(referenceContext)}${webResearchContextBlock(webResearchContext, webResearchAsOf)}`;
}

export function podcastDirectorUserMessage(input: {
  setup: Record<string, unknown>;
  audioPlanJson: string;
  referenceContext?: string;
  webResearchContext?: string;
  webResearchAsOf?: string;
}): string {
  const language = String(input.setup.language ?? "en");

  return `${generationDateContext()}

${languageInstruction(language)}

Write the full tagged podcast script AND build complete AudioDirection JSON for TTS in one response.

Audio plan:
${input.audioPlanJson}

Script rules:
- Use exact speaker names from the plan as labels (e.g. "Maya:", "Jordan:").
- Embed English audio tags: [excitedly], [laughs], [serious], [whispers], etc.
- If segments are defined, structure transcript so each segment's lines use only those segment speakers.
- Put the full script in the \`transcript\` field only — do NOT repeat it inside \`ttsPrompt\`.
- Do not use stale training-data timelines; prefer web research facts and today's date.

Build ttsPrompt as ONE markdown string (not a nested JSON object). Use \\n between sections: Audio Profile + Scene + Director's Notes + Sample Context per primary host.
Speaker names in transcript MUST match speakers array exactly.
Include segments array from plan if multi-segment, with \`transcriptExcerpt\` per segmentId.

Output JSON AudioDirection with mode, targetDurationMinutes, estimatedWordCount, language, speakers, ttsPrompt (single markdown string), transcript, segments.${referenceContextBlock(input.referenceContext)}${webResearchContextBlock(input.webResearchContext, input.webResearchAsOf)}`;
}

export function podcastCoverPrompt(input: {
  setup: Record<string, unknown>;
  title: string;
  referenceContext?: string;
  webResearchContext?: string;
  webResearchAsOf?: string;
}): string {
  const podcastType = resolveSetupLabel(
    String(input.setup.podcastType ?? ""),
    input.setup.podcastTypeCustom as string | undefined,
  );
  const topicIdea = String(input.setup.topicIdea ?? "");

  return `${generationDateContext()}

Podcast episode cover art for "${input.title}".
Show type: ${podcastType}. Topic: ${topicIdea}.
Bold, modern podcast artwork. No readable body text. Portrait 3:4.${referenceContextBlock(input.referenceContext)}${webResearchContextBlock(input.webResearchContext, input.webResearchAsOf)}`;
}

export function extractSegmentTranscript(
  fullTranscript: string,
  speakerNames: string[],
): string {
  const lines = fullTranscript.split("\n").filter((l) => l.trim());
  const filtered = lines.filter((line) =>
    speakerNames.some((name) => line.includes(`${name}:`)),
  );
  return filtered.length > 0 ? filtered.join("\n") : fullTranscript;
}
