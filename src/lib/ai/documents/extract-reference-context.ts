import { uploadBufferToGemini } from "@/lib/ai/documents/gemini-files";
import {
  referenceExtractSystemInstruction,
  referenceExtractUserMessage,
} from "@/lib/ai/prompts/reference";
import {
  createMultimodalInteraction,
  type MultimodalInputPart,
} from "@/lib/ai/text/interactions";
import {
  downloadAssetBuffer,
  getCreationAssetsByIds,
} from "@/lib/content/assets";

function fileNameFromPath(storagePath: string): string {
  const base = storagePath.split("/").pop() ?? "reference";
  const underscore = base.indexOf("_");
  return underscore >= 0 ? base.slice(underscore + 1) : base;
}

export async function extractReferenceContext(input: {
  contentKey: string;
  creationId: string;
  setup: Record<string, unknown>;
  assetIds: string[];
}): Promise<string> {
  const assets = await getCreationAssetsByIds(
    input.contentKey,
    input.creationId,
    input.assetIds,
  );

  if (assets.length === 0) {
    throw new Error("Reference files not found");
  }

  const geminiFiles = await Promise.all(
    assets.map(async (asset) => {
      const buffer = await downloadAssetBuffer(asset.storage_path);
      const mimeType = asset.mime_type ?? "application/octet-stream";
      return uploadBufferToGemini({
        buffer,
        mimeType,
        displayName: fileNameFromPath(asset.storage_path),
      });
    }),
  );

  const documentParts: MultimodalInputPart[] = geminiFiles.map((file) => ({
    type: "document",
    uri: file.uri,
    mime_type: file.mimeType,
  }));

  const result = await createMultimodalInteraction({
    parts: [
      ...documentParts,
      { type: "text", text: referenceExtractUserMessage(input.setup) },
    ],
    systemInstruction: referenceExtractSystemInstruction(),
    temperature: 0.4,
  });

  return result.text;
}
