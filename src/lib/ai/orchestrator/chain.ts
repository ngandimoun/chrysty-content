import { waitUntil } from "@vercel/functions";

import {
  CONTENT_KEY_HEADER,
  GENERATION_SECRET_HEADER,
} from "@/lib/content/constants";

let missingSecretWarned = false;

function getAppBaseUrl(): string {
  if (process.env.APP_URL?.trim()) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function warnMissingGenerationSecret() {
  if (missingSecretWarned) return;
  missingSecretWarned = true;

  const message =
    "GENERATION_INTERNAL_SECRET is not set — generation will stall after the first pipeline step. Add it to .env.local and restart the dev server.";

  if (process.env.NODE_ENV === "development") {
    console.error(`[generation] ${message}`);
  } else {
    console.warn(`[generation] ${message}`);
  }
}

function chainNextStepFetch(
  url: string,
  headers: Record<string, string>,
): Promise<void> {
  return fetch(url, { method: "POST", headers }).then((response) => {
    if (!response.ok) {
      throw new Error(
        `Generation self-chain failed (${response.status} ${response.statusText})`,
      );
    }
  });
}

export function scheduleNextStep(creationId: string, contentKey: string) {
  const secret = process.env.GENERATION_INTERNAL_SECRET?.trim();
  if (!secret) {
    warnMissingGenerationSecret();
    return;
  }

  const url = `${getAppBaseUrl()}/api/creations/${creationId}/generate?contentKey=${encodeURIComponent(contentKey)}`;
  const headers = {
    [CONTENT_KEY_HEADER]: contentKey,
    [GENERATION_SECRET_HEADER]: secret,
  };

  const chainPromise = chainNextStepFetch(url, headers).catch((error) => {
    console.error("Failed to schedule next generation step", error);
  });

  // waitUntil is unreliable in local `next dev`; always fire fetch directly in dev too.
  if (process.env.NODE_ENV === "development") {
    void chainPromise;
  }

  waitUntil(chainPromise);
}

export function isInternalGenerationRequest(request: Request): boolean {
  const secret = process.env.GENERATION_INTERNAL_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get(GENERATION_SECRET_HEADER) === secret;
}
