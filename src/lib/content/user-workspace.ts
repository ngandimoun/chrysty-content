import { createAdminClient } from "@/lib/supabase/admin";

import { ensureContentWorkspace } from "./workspace";

function createContentKey(): string {
  return `ck_${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function getDefaultContentKeyForUser(
  userId: string,
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_workspaces")
    .select("content_key")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.content_key ?? null;
}

export async function ensureDefaultContentKeyForUser(
  userId: string,
): Promise<string> {
  const existing = await getDefaultContentKeyForUser(userId);
  if (existing) {
    return existing;
  }

  const contentKey = createContentKey();
  await ensureContentWorkspace(contentKey, userId);
  return contentKey;
}
