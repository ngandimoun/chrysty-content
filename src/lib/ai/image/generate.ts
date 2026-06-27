import type { ContentListUnion } from "@google/genai";

import {
  getGeminiClient,
  getImageFallbackModel,
  getImageModel,
} from "@/lib/ai/gemini-client";
import {
  errorMessage,
  isModelUnavailableError,
  isPolicyBlockedError,
} from "@/lib/ai/gemini-errors";

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
}

type ImagePart = {
  text?: string;
  thought?: boolean;
  inlineData?: { data?: string; mimeType?: string };
};

type ImageResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: ImagePart[] };
  }>;
  promptFeedback?: {
    blockReason?: string;
    blockReasonMessage?: string;
  };
};

export interface ImageExtractionDiagnostics {
  finishReasons: string[];
  textSnippets: string[];
  blockReason?: string;
}

const SIMPLIFIED_PROMPT_SUFFIX =
  "\n\nSimple abstract portrait cover, no readable text, soft colors, 3:4 aspect ratio.";

type ResponseModality = "IMAGE" | "TEXT";

type ImageAttempt = {
  model: string;
  modalities: ResponseModality[];
  promptSuffix?: string;
  label: string;
};

export function collectImageDiagnostics(
  response: ImageResponse,
): ImageExtractionDiagnostics {
  const finishReasons: string[] = [];
  const textSnippets: string[] = [];

  for (const candidate of response.candidates ?? []) {
    if (candidate.finishReason) {
      finishReasons.push(candidate.finishReason);
    }
    for (const part of candidate.content?.parts ?? []) {
      if (part.text?.trim()) {
        textSnippets.push(part.text.trim().slice(0, 200));
      }
    }
  }

  const blockReason =
    response.promptFeedback?.blockReasonMessage ??
    response.promptFeedback?.blockReason;

  return {
    finishReasons,
    textSnippets,
    blockReason,
  };
}

export function extractImageFromResponse(
  response: ImageResponse,
): GeneratedImage | null {
  let lastImage: GeneratedImage | null = null;

  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.thought === true) {
        continue;
      }
      if (part.inlineData?.data) {
        lastImage = {
          buffer: Buffer.from(part.inlineData.data, "base64"),
          mimeType: part.inlineData.mimeType ?? "image/png",
        };
      }
    }
  }

  return lastImage;
}

export function formatEmptyImageError(
  label: string,
  diagnostics: ImageExtractionDiagnostics,
): string {
  const parts = [`${label} returned no image data`];

  if (diagnostics.blockReason) {
    parts.push(`block: ${diagnostics.blockReason}`);
  }
  if (diagnostics.finishReasons.length > 0) {
    parts.push(`finish: ${diagnostics.finishReasons.join(", ")}`);
  }
  if (diagnostics.textSnippets.length > 0) {
    parts.push(`text: ${diagnostics.textSnippets[0]}`);
  }

  return parts.join("; ");
}

function buildImageAttemptChain(): ImageAttempt[] {
  const primary = getImageModel();
  const fallback = getImageFallbackModel();

  return [
    { model: primary, modalities: ["IMAGE"], label: "primary/image-only" },
    {
      model: primary,
      modalities: ["TEXT", "IMAGE"],
      label: "primary/text+image",
    },
    {
      model: fallback,
      modalities: ["TEXT", "IMAGE"],
      label: "fallback/text+image",
    },
    {
      model: fallback,
      modalities: ["TEXT", "IMAGE"],
      promptSuffix: SIMPLIFIED_PROMPT_SUFFIX,
      label: "fallback/simplified",
    },
  ];
}

function buildContents(
  prompt: string,
  baseContents: unknown,
  promptSuffix?: string,
): unknown {
  const fullPrompt = prompt + (promptSuffix ?? "");

  if (typeof baseContents === "string") {
    return fullPrompt;
  }

  if (Array.isArray(baseContents)) {
    return baseContents.map((part, index) =>
      index === 0 && part && typeof part === "object" && "text" in part
        ? { ...part, text: fullPrompt }
        : part,
    );
  }

  return fullPrompt;
}

function isRetryableImageError(error: unknown): boolean {
  if (isModelUnavailableError(error) || isPolicyBlockedError(error)) {
    return true;
  }

  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate") ||
    message.includes("resource exhausted") ||
    message.includes("timeout") ||
    message.includes("503") ||
    message.includes("500") ||
    message.includes("no image data")
  );
}

async function generateImageWithRetries(input: {
  prompt: string;
  contents?: unknown;
  creationId?: string;
  errorLabel: string;
}): Promise<GeneratedImage> {
  const ai = getGeminiClient();
  const attempts = buildImageAttemptChain();
  const baseContents = input.contents ?? input.prompt;
  let lastError: unknown;
  let lastDiagnostics: ImageExtractionDiagnostics = {
    finishReasons: [],
    textSnippets: [],
  };

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i]!;

    try {
      if (i > 0) {
        console.info("[image] retry", {
          attempt: i + 1,
          strategy: attempt.label,
          creationId: input.creationId,
        });
      }

      const response = await ai.models.generateContent({
        model: attempt.model,
        contents: buildContents(
          input.prompt,
          baseContents,
          attempt.promptSuffix,
        ) as ContentListUnion,
        config: {
          responseModalities: attempt.modalities,
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K",
          },
        },
      });

      const image = extractImageFromResponse(response as ImageResponse);
      if (image) {
        return image;
      }

      lastDiagnostics = collectImageDiagnostics(response as ImageResponse);
      lastError = new Error(
        formatEmptyImageError(input.errorLabel, lastDiagnostics),
      );

      const hasNext = i < attempts.length - 1;
      if (!hasNext) {
        break;
      }

      console.warn("[image] attempt returned no image, trying next strategy", {
        attempt: i + 1,
        strategy: attempt.label,
        creationId: input.creationId,
        diagnostics: lastDiagnostics,
      });
    } catch (error) {
      lastError = error;
      const hasNext = i < attempts.length - 1;

      if (!isRetryableImageError(error) || !hasNext) {
        throw error;
      }

      console.warn("[image] attempt failed, trying next strategy", {
        attempt: i + 1,
        strategy: attempt.label,
        creationId: input.creationId,
        error: errorMessage(error),
      });
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(formatEmptyImageError(input.errorLabel, lastDiagnostics));
}

export async function generateCoverImage(
  promptOrInput: string | { prompt: string; creationId?: string },
): Promise<GeneratedImage> {
  const prompt =
    typeof promptOrInput === "string" ? promptOrInput : promptOrInput.prompt;
  const creationId =
    typeof promptOrInput === "string" ? undefined : promptOrInput.creationId;

  return generateImageWithRetries({
    prompt,
    creationId,
    errorLabel: "Image model",
  });
}

export async function generateIllustrationImage(input: {
  prompt: string;
  referenceImage?: { buffer: Buffer; mimeType: string };
  creationId?: string;
}): Promise<GeneratedImage> {
  const contents = input.referenceImage
    ? [
        { text: input.prompt },
        {
          inlineData: {
            mimeType: input.referenceImage.mimeType,
            data: input.referenceImage.buffer.toString("base64"),
          },
        },
      ]
    : input.prompt;

  return generateImageWithRetries({
    prompt: input.prompt,
    contents,
    creationId: input.creationId,
    errorLabel: "Illustration model",
  });
}
