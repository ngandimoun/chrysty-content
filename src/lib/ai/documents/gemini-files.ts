import { getGeminiClient } from "@/lib/ai/gemini-client";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;

export interface GeminiUploadedFile {
  uri: string;
  mimeType: string;
  name: string;
}

export async function uploadBufferToGemini(input: {
  buffer: Buffer;
  mimeType: string;
  displayName: string;
}): Promise<GeminiUploadedFile> {
  const ai = getGeminiClient();
  const blob = new Blob([new Uint8Array(input.buffer)], { type: input.mimeType });

  const file = await ai.files.upload({
    file: blob,
    config: {
      mimeType: input.mimeType,
      displayName: input.displayName,
    },
  });

  if (!file.name) {
    throw new Error("Gemini file upload missing name");
  }

  let fileInfo = await ai.files.get({ name: file.name });
  let attempts = 0;

  while (fileInfo.state === "PROCESSING" && attempts < MAX_POLL_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    fileInfo = await ai.files.get({ name: file.name });
    attempts += 1;
  }

  if (fileInfo.state === "FAILED") {
    throw new Error(`Gemini failed to process "${input.displayName}"`);
  }

  if (fileInfo.state === "PROCESSING") {
    throw new Error(`Gemini file processing timed out for "${input.displayName}"`);
  }

  if (!fileInfo.uri) {
    throw new Error(`Gemini file missing uri for "${input.displayName}"`);
  }

  return {
    uri: fileInfo.uri,
    mimeType: fileInfo.mimeType ?? input.mimeType,
    name: fileInfo.name ?? file.name,
  };
}
