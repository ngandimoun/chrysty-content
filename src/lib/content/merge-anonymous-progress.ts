import { linkContentWorkspaceToUser } from "@/lib/content/workspace";
import { createAdminClient } from "@/lib/supabase/admin";

export async function mergeAnonymousProgress(
  contentKey: string,
  userId: string,
) {
  await linkContentWorkspaceToUser(contentKey, userId);

  const supabase = createAdminClient();

  const { data: anonProgress } = await supabase
    .from("content_consumption_progress")
    .select("*")
    .eq("content_key", contentKey)
    .is("user_id", null);

  for (const anon of anonProgress ?? []) {
    const { data: userRow } = await supabase
      .from("content_consumption_progress")
      .select("*")
      .eq("creation_id", anon.creation_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!userRow) {
      await supabase
        .from("content_consumption_progress")
        .update({ user_id: userId, content_key: null })
        .eq("id", anon.id);
      continue;
    }

    const anonScore =
      Number(anon.progress_percent) * 1000 +
      new Date(anon.last_opened_at ?? 0).getTime() / 1000;
    const userScore =
      Number(userRow.progress_percent) * 1000 +
      new Date(userRow.last_opened_at ?? 0).getTime() / 1000;

    if (anonScore > userScore) {
      await supabase
        .from("content_consumption_progress")
        .update({
          consumption_status: anon.consumption_status,
          progress_percent: anon.progress_percent,
          current_page: anon.current_page,
          current_position_seconds: anon.current_position_seconds,
          playback_speed: anon.playback_speed,
          time_spent_seconds: Math.max(
            anon.time_spent_seconds,
            userRow.time_spent_seconds,
          ),
          session_count: anon.session_count + userRow.session_count,
          started_at: anon.started_at ?? userRow.started_at,
          last_opened_at: anon.last_opened_at ?? userRow.last_opened_at,
          last_played_at: anon.last_played_at ?? userRow.last_played_at,
          completed_at: anon.completed_at ?? userRow.completed_at,
          resume_context: anon.resume_context,
        })
        .eq("id", userRow.id);
    }

    await supabase
      .from("content_consumption_progress")
      .delete()
      .eq("id", anon.id);
  }

  await supabase
    .from("content_consumption_events")
    .update({ user_id: userId, content_key: null })
    .eq("content_key", contentKey)
    .is("user_id", null);

  await supabase
    .from("content_consumption_annotations")
    .update({ user_id: userId, content_key: null })
    .eq("content_key", contentKey)
    .is("user_id", null);
}
