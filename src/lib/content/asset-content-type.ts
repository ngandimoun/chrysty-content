const EXTENSION_MIME: Record<string, string> = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".json": "application/json",
};

const ASSET_TYPE_MIME: Record<string, string> = {
  audio: "audio/wav",
  cover: "image/png",
  illustration: "image/png",
  script: "application/json",
};

function mimeFromPath(storagePath: string): string | undefined {
  const lower = storagePath.toLowerCase();
  for (const [ext, mime] of Object.entries(EXTENSION_MIME)) {
    if (lower.endsWith(ext)) {
      return mime;
    }
  }
  return undefined;
}

export function resolveAssetContentType(input: {
  mime_type: string | null;
  storage_path: string;
  asset_type?: string | null;
}): string {
  const stored = input.mime_type?.trim();
  if (stored && stored !== "application/octet-stream") {
    return stored;
  }

  const fromPath = mimeFromPath(input.storage_path);
  if (fromPath) {
    return fromPath;
  }

  if (input.asset_type) {
    const fromType = ASSET_TYPE_MIME[input.asset_type];
    if (fromType) {
      return fromType;
    }
  }

  return stored ?? "application/octet-stream";
}
