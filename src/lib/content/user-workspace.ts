import { createAdminClient } from "@/lib/supabase/admin";

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
