"use client";

import { CONTENT_KEY_STORAGE } from "./constants";

function createContentKey(): string {
  return `ck_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function getOrCreateContentKey(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(CONTENT_KEY_STORAGE)?.trim();
  if (existing) {
    return existing;
  }

  const created = createContentKey();
  window.localStorage.setItem(CONTENT_KEY_STORAGE, created);
  return created;
}
