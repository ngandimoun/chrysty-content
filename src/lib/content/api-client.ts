"use client";

import type { CreationInput } from "@/features/creation/types";
import type {
  ConsumptionAnnotation,
  ConsumptionEventInput,
  ConsumptionProgressPatch,
  ConsumptionSnapshot,
  UserProfileStats,
} from "@/types/consumption";
import type { Creation, RecentActivity } from "@/types/creation";

import { CONTENT_KEY_HEADER } from "./constants";
import { getOrCreateContentKey } from "./identity";

async function contentFetch<T>(
  path: string,
  init?: RequestInit,
  authHeaders?: Record<string, string>,
): Promise<T> {
  const contentKey = getOrCreateContentKey();
  const headers = new Headers(init?.headers);
  headers.set(CONTENT_KEY_HEADER, contentKey);

  if (authHeaders) {
    for (const [key, value] of Object.entries(authHeaders)) {
      headers.set(key, value);
    }
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function fetchCreationsFromApi(
  authHeaders?: Record<string, string>,
): Promise<Creation[]> {
  return contentFetch<Creation[]>("/api/creations", undefined, authHeaders);
}

export async function fetchRecentActivityFromApi(
  authHeaders?: Record<string, string>,
): Promise<RecentActivity[]> {
  return contentFetch<RecentActivity[]>(
    "/api/activity",
    undefined,
    authHeaders,
  );
}

export async function fetchCollectionsFromApi(
  authHeaders?: Record<string, string>,
): Promise<Record<string, Creation[]>> {
  return contentFetch<Record<string, Creation[]>>(
    "/api/creations/collections",
    undefined,
    authHeaders,
  );
}

export async function fetchProfileStatsFromApi(
  authHeaders?: Record<string, string>,
): Promise<UserProfileStats> {
  return contentFetch<UserProfileStats>(
    "/api/profile/stats",
    undefined,
    authHeaders,
  );
}

export async function createCreationViaApi(
  input: CreationInput,
  files?: File[],
): Promise<Creation> {
  if (files && files.length > 0) {
    const contentKey = getOrCreateContentKey();
    const formData = new FormData();
    formData.append("setup", JSON.stringify(input));
    for (const file of files) {
      formData.append("files", file);
    }

    const response = await fetch("/api/creations", {
      method: "POST",
      headers: {
        [CONTENT_KEY_HEADER]: contentKey,
      },
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed (${response.status})`);
    }

    return response.json() as Promise<Creation>;
  }

  return contentFetch<Creation>("/api/creations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchCreationDetail(
  id: string,
  authHeaders?: Record<string, string>,
): Promise<Creation> {
  return contentFetch<Creation>(`/api/creations/${id}`, undefined, authHeaders);
}

export type CreationManifestResponse =
  | {
      type: "story";
      manifest: import("@/types/content-metadata").BookManifest;
      assets: Record<string, string>;
    }
  | {
      type: "audiobook" | "podcast";
      manifest: import("@/types/content-metadata").AudioManifest;
      assets: Record<string, string>;
    };

export async function fetchCreationManifest(
  id: string,
): Promise<CreationManifestResponse> {
  return contentFetch<CreationManifestResponse>(`/api/creations/${id}/manifest`);
}

export async function triggerGenerationViaApi(
  creationId: string,
): Promise<{ done: boolean; progress: number; status: string }> {
  return contentFetch(`/api/creations/${creationId}/generate`, {
    method: "POST",
  });
}

export async function patchCreationViaApi(
  id: string,
  patch: Partial<Pick<Creation, "isFavorite" | "title">> & { archived?: boolean },
  authHeaders?: Record<string, string>,
): Promise<Creation> {
  return contentFetch<Creation>(
    `/api/creations/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
    authHeaders,
  );
}

export async function patchConsumptionViaApi(
  id: string,
  patch: ConsumptionProgressPatch,
  authHeaders?: Record<string, string>,
): Promise<ConsumptionSnapshot> {
  return contentFetch<ConsumptionSnapshot>(
    `/api/creations/${id}/consumption`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
    authHeaders,
  );
}

export async function postConsumptionEventsViaApi(
  id: string,
  events: ConsumptionEventInput[],
  authHeaders?: Record<string, string>,
): Promise<{ ok: boolean }> {
  return contentFetch<{ ok: boolean }>(
    `/api/creations/${id}/events`,
    {
      method: "POST",
      body: JSON.stringify({ events }),
    },
    authHeaders,
  );
}

export async function fetchAnnotationsViaApi(
  id: string,
  authHeaders?: Record<string, string>,
): Promise<ConsumptionAnnotation[]> {
  return contentFetch<ConsumptionAnnotation[]>(
    `/api/creations/${id}/annotations`,
    undefined,
    authHeaders,
  );
}

export async function createAnnotationViaApi(
  id: string,
  input: Omit<ConsumptionAnnotation, "id" | "creationId" | "createdAt" | "updatedAt"> & {
    kind: ConsumptionAnnotation["kind"];
  },
  authHeaders?: Record<string, string>,
): Promise<ConsumptionAnnotation> {
  return contentFetch<ConsumptionAnnotation>(
    `/api/creations/${id}/annotations`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    authHeaders,
  );
}

export async function deleteAnnotationViaApi(
  id: string,
  annotationId: string,
  authHeaders?: Record<string, string>,
): Promise<{ ok: boolean }> {
  return contentFetch<{ ok: boolean }>(
    `/api/creations/${id}/annotations?annotationId=${encodeURIComponent(annotationId)}`,
    { method: "DELETE" },
    authHeaders,
  );
}

export async function askAssistantViaApi(
  id: string,
  prompt: string,
  authHeaders?: Record<string, string>,
): Promise<{ text: string }> {
  return contentFetch<{ text: string }>(
    `/api/creations/${id}/assistant`,
    {
      method: "POST",
      body: JSON.stringify({ prompt }),
    },
    authHeaders,
  );
}

export async function uploadAssetViaApi(
  creationId: string,
  file: File,
  assetType: "audio" | "cover" | "script" | "source" | "illustration",
): Promise<{ id: string }> {
  const contentKey = getOrCreateContentKey();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("assetType", assetType);

  const response = await fetch(`/api/creations/${creationId}/upload`, {
    method: "POST",
    headers: {
      [CONTENT_KEY_HEADER]: contentKey,
    },
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Upload failed (${response.status})`);
  }

  return response.json() as Promise<{ id: string }>;
}
