import { WORKER_SLUG } from "@/lib/chrysty/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

export type ContentWorkspaceRow = Tables<"content_workspaces">;

function createVisitorToken(): string {
  return `vis_${crypto.randomUUID().replace(/-/g, "")}`;
}

function isInsertConflict(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

async function findPlatformWorkspaceId(userId: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("worker_workspaces")
    .select("id")
    .eq("user_id", userId)
    .eq("worker_slug", WORKER_SLUG)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

async function findWorkspaceByContentKey(
  contentKey: string,
): Promise<ContentWorkspaceRow | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_workspaces")
    .select("*")
    .eq("content_key", contentKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function linkContentWorkspaceToUser(
  contentKey: string,
  userId: string,
): Promise<void> {
  const supabase = createAdminClient();
  const platformWorkspaceId = await findPlatformWorkspaceId(userId);

  const update: Partial<TablesInsert<"content_workspaces">> = {
    user_id: userId,
  };

  if (platformWorkspaceId) {
    update.platform_workspace_id = platformWorkspaceId;
  }

  await supabase
    .from("content_workspaces")
    .update(update)
    .eq("content_key", contentKey)
    .is("user_id", null);
}

export async function ensureContentWorkspace(
  contentKey: string,
  userId?: string,
): Promise<ContentWorkspaceRow> {
  const existing = await findWorkspaceByContentKey(contentKey);
  if (existing) {
    if (userId && !existing.user_id) {
      await linkContentWorkspaceToUser(contentKey, userId);
      const linked = await findWorkspaceByContentKey(contentKey);
      if (linked) {
        return linked;
      }
    }
    return existing;
  }

  const supabase = createAdminClient();
  const platformWorkspaceId = userId
    ? await findPlatformWorkspaceId(userId)
    : null;

  const insert: TablesInsert<"content_workspaces"> = {
    content_key: contentKey,
    visitor_token: createVisitorToken(),
    name: "My Library",
    is_default: true,
    user_id: userId ?? null,
    platform_workspace_id: platformWorkspaceId,
  };

  const { data: created, error: insertError } = await supabase
    .from("content_workspaces")
    .insert(insert)
    .select("*")
    .single();

  if (insertError) {
    if (isInsertConflict(insertError)) {
      const retry = await findWorkspaceByContentKey(contentKey);
      if (retry) {
        return retry;
      }
    }

    throw new Error(insertError.message);
  }

  return created;
}
