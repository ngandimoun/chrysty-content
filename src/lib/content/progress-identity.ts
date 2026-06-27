import type { Tables } from "@/lib/supabase/database.types";

export const AUTH_TOKEN_HEADER = "authorization";

export interface ProgressIdentity {
  userId?: string;
  contentKey: string;
}

export type ConsumptionProgressRow = Tables<"content_consumption_progress">;

export function buildIdentityFilter(identity: ProgressIdentity) {
  if (identity.userId) {
    return { user_id: identity.userId, content_key: null };
  }
  return { user_id: null, content_key: identity.contentKey };
}

export function identityInsertFields(identity: ProgressIdentity) {
  if (identity.userId) {
    return { user_id: identity.userId, content_key: null };
  }
  return { user_id: null, content_key: identity.contentKey };
}
