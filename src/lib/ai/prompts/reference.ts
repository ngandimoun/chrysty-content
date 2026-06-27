import { resolveSetupLabel } from "@/lib/ai/prompts/shared";

export function referenceExtractSystemInstruction(): string {
  return `You are a document analyst for Chrysty Creative Library.
Your job is to read user-uploaded reference documents and extract material that will guide AI generation of stories, podcasts, or audiobooks.
Be thorough but concise. Preserve factual accuracy. Note visual elements in PDFs (charts, diagrams, layouts) when relevant.
Output plain structured text — not JSON. Use clear section headings.`;
}

export function referenceExtractUserMessage(setup: Record<string, unknown>): string {
  const category = String(setup.category ?? "story");
  const language = String(setup.language ?? "en");

  const lines = [
    `The user is creating a ${category} in language ${language}.`,
    "Extract everything useful from the attached reference document(s) for downstream creative generation.",
    "",
    "Include when present:",
    "- Key facts, data, and quotes",
    "- Themes, tone, and audience signals",
    "- Characters, settings, or narrative seeds",
    "- Structure or outline suggestions",
    "- Visual or design cues (from PDF layouts, charts, diagrams)",
    "",
    "User form inputs (combine with documents — do not ignore either):",
  ];

  if (category === "story") {
    lines.push(
      `- Story type: ${resolveSetupLabel(String(setup.storyType ?? ""), setup.storyTypeCustom as string | undefined)}`,
      `- Main idea: ${String(setup.mainIdea ?? "")}`,
      `- Audience: ${String(setup.audience ?? "adult")}`,
    );
  } else if (category === "audiobook") {
    lines.push(
      `- Audiobook type: ${resolveSetupLabel(String(setup.audiobookType ?? ""), setup.audiobookTypeCustom as string | undefined)}`,
      `- Topic: ${String(setup.topicIdea ?? "")}`,
      `- Voice style: ${resolveSetupLabel(String(setup.voiceStyle ?? ""), setup.voiceStyleCustom as string | undefined)}`,
    );
  } else {
    lines.push(
      `- Podcast type: ${resolveSetupLabel(String(setup.podcastType ?? ""), setup.podcastTypeCustom as string | undefined)}`,
      `- Topic: ${String(setup.topicIdea ?? "")}`,
    );
    if (setup.newsType) lines.push(`- News type: ${String(setup.newsType)}`);
    if (setup.subject) {
      lines.push(
        `- Subject: ${resolveSetupLabel(String(setup.subject), setup.subjectCustom as string | undefined)}`,
      );
    }
    if (setup.participants) lines.push(`- Participants: ${String(setup.participants)}`);
  }

  return lines.join("\n");
}
