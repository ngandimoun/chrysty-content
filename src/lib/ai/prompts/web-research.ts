import {
  generationDateContext,
  generationDateIso,
  resolveSetupLabel,
} from "@/lib/ai/prompts/shared";

export function webResearchSystemInstruction(now = new Date()): string {
  const today = generationDateIso(now);
  return `You are a podcast research analyst for Chrysty Creative Library.
Today is ${today}. Use Google Search to find the most recent, credible information about the user's topic.
Prioritize sources from the last 7–30 days before ${today} when the topic is news or fast-moving.
Do not present older events (e.g. from January) as current unless they are historically relevant background.
Include specific dates, names, numbers, and quotes when available.
If little recent news exists (e.g. evergreen storytelling topics), say so and provide the best available context.
Output plain structured text — not JSON. Use clear section headings.`;
}

export function webResearchUserMessage(setup: Record<string, unknown>): string {
  const today = generationDateIso();
  const language = String(setup.language ?? "en");
  const podcastType = resolveSetupLabel(
    String(setup.podcastType ?? ""),
    setup.podcastTypeCustom as string | undefined,
  );
  const topicIdea = String(setup.topicIdea ?? "");
  const participants = setup.participants
    ? String(setup.participants)
    : undefined;
  const newsType = setup.newsType ? String(setup.newsType) : undefined;
  const subject = setup.subject
    ? resolveSetupLabel(
        String(setup.subject),
        setup.subjectCustom as string | undefined,
      )
    : undefined;

  const lines = [
    generationDateContext(),
    `Search for the latest developments on this podcast topic as of ${today}.`,
    "",
    "Episode details:",
    `- Language: ${language}`,
    `- Podcast type: ${podcastType}`,
    `- Topic / idea: ${topicIdea}`,
  ];

  if (newsType) lines.push(`- News type: ${newsType}`);
  if (subject) lines.push(`- Subject: ${subject}`);
  if (participants) lines.push(`- Participants format: ${participants}`);

  lines.push(
    "",
    "Research requirements:",
    "- Search multiple queries if needed to capture the freshest facts",
    `- Prefer sources published or updated within the last 7–30 days before ${today} when relevant`,
    "- Include key facts, recent developments, notable quotes/data, and discussion angles",
    "- Note any controversies, open questions, or breaking updates",
    "",
    "Output sections:",
    "## Key Facts",
    "## Recent Developments",
    "## Notable Quotes / Data",
    "## Angles for Discussion",
  );

  return lines.join("\n");
}
