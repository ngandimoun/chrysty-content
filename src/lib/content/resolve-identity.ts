import { getContentKeyFromRequest } from "./request";
import { getUserIdFromRequest } from "@/lib/supabase/server";
import type { ProgressIdentity } from "./progress-identity";

export async function resolveIdentityFromRequest(
  request: Request,
): Promise<ProgressIdentity | null> {
  const contentKey = getContentKeyFromRequest(request);
  if (!contentKey) {
    return null;
  }

  const userId = (await getUserIdFromRequest(request)) ?? undefined;
  return { contentKey, userId };
}
