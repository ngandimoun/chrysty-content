import {
  webResearchSystemInstruction,
  webResearchUserMessage,
} from "@/lib/ai/prompts/web-research";
import { createGroundedSearchInteraction } from "@/lib/ai/text/interactions";

export interface WebResearchResult {
  context: string;
  citations: Array<{ title: string; url: string }>;
}

export async function fetchPodcastWebResearch(input: {
  setup: Record<string, unknown>;
}): Promise<WebResearchResult> {
  const result = await createGroundedSearchInteraction({
    userMessage: webResearchUserMessage(input.setup),
    systemInstruction: webResearchSystemInstruction(new Date()),
  });

  return {
    context: result.text,
    citations: result.citations,
  };
}
