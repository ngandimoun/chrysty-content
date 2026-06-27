import { isModelUnavailableError } from "@/lib/ai/gemini-errors";
import {
  getGeminiClient,
  getResearchFallbackModel,
  getResearchModel,
  getTextFallbackModel,
  getTextModel,
} from "@/lib/ai/gemini-client";

export type MultimodalInputPart =
  | { type: "text"; text: string }
  | { type: "document"; uri: string; mime_type: string };

export interface MultimodalInteractionResult {
  text: string;
  interactionId: string;
  model: string;
}

async function createWithModel(input: {
  model: string;
  parts: MultimodalInputPart[];
  systemInstruction?: string;
  previousInteractionId?: string;
  temperature?: number;
}): Promise<MultimodalInteractionResult> {
  const ai = getGeminiClient();

  const interaction = await ai.interactions.create({
    model: input.model,
    input: input.parts,
    system_instruction: input.systemInstruction,
    previous_interaction_id: input.previousInteractionId,
    generation_config: {
      temperature: input.temperature ?? 0.4,
      thinking_level: "low",
    },
  });

  const text = interaction.output_text?.trim();
  if (!text) {
    throw new Error("Multimodal model returned empty response");
  }

  if (!interaction.id) {
    throw new Error("Multimodal interaction missing id");
  }

  return { text, interactionId: interaction.id, model: input.model };
}

export interface GroundedSearchInteractionResult {
  text: string;
  interactionId: string;
  model: string;
  citations: Array<{ title: string; url: string }>;
}

function extractCitationsFromInteraction(interaction: {
  steps?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{
        type?: string;
        url?: string;
        title?: string;
      }>;
    }>;
  }>;
}): Array<{ title: string; url: string }> {
  const seen = new Set<string>();
  const citations: Array<{ title: string; url: string }> = [];

  for (const step of interaction.steps ?? []) {
    if (step.type !== "model_output") continue;

    for (const block of step.content ?? []) {
      if (block.type !== "text") continue;

      for (const annotation of block.annotations ?? []) {
        if (annotation.type !== "url_citation" || !annotation.url) continue;
        if (seen.has(annotation.url)) continue;

        seen.add(annotation.url);
        citations.push({
          title: annotation.title ?? annotation.url,
          url: annotation.url,
        });
      }
    }
  }

  return citations;
}

async function createGroundedSearchWithModel(input: {
  model: string;
  userMessage: string;
  systemInstruction?: string;
}): Promise<GroundedSearchInteractionResult> {
  const ai = getGeminiClient();

  const interaction = await ai.interactions.create({
    model: input.model,
    input: input.userMessage,
    system_instruction: input.systemInstruction,
    tools: [{ type: "google_search" }],
    generation_config: {
      temperature: 0.4,
      thinking_level: "low",
    },
  });

  const text = interaction.output_text?.trim();
  if (!text) {
    throw new Error("Grounded search returned empty response");
  }

  if (!interaction.id) {
    throw new Error("Grounded search interaction missing id");
  }

  return {
    text,
    interactionId: interaction.id,
    model: input.model,
    citations: extractCitationsFromInteraction(interaction),
  };
}

export async function createGroundedSearchInteraction(input: {
  userMessage: string;
  systemInstruction?: string;
  model?: string;
}): Promise<GroundedSearchInteractionResult> {
  const primary = input.model ?? getResearchModel();
  const fallback = getResearchFallbackModel();

  try {
    return await createGroundedSearchWithModel({ ...input, model: primary });
  } catch (error) {
    if (!isModelUnavailableError(error) || primary === fallback) {
      throw error;
    }
    return createGroundedSearchWithModel({ ...input, model: fallback });
  }
}

export async function createMultimodalInteraction(input: {
  parts: MultimodalInputPart[];
  systemInstruction?: string;
  previousInteractionId?: string;
  temperature?: number;
}): Promise<MultimodalInteractionResult> {
  const primary = getTextModel();
  const fallback = getTextFallbackModel();

  try {
    return await createWithModel({ ...input, model: primary });
  } catch (error) {
    if (!isModelUnavailableError(error)) {
      throw error;
    }
    return createWithModel({ ...input, model: fallback });
  }
}

export async function createTextInteraction(input: {
  userMessage: string;
  systemInstruction?: string;
  previousInteractionId?: string;
  temperature?: number;
}): Promise<{ text: string; interactionId: string }> {
  const result = await createMultimodalInteraction({
    parts: [{ type: "text", text: input.userMessage }],
    systemInstruction: input.systemInstruction,
    previousInteractionId: input.previousInteractionId,
    temperature: input.temperature,
  });

  return { text: result.text, interactionId: result.interactionId };
}
