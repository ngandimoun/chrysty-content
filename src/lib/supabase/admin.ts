import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

function missingAdminEnvMessage(missing: string[]): string {
  return `Supabase admin client is not configured. Missing ${missing.join(" and ")} in .env.local.`;
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const missing = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !key ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter((name): name is string => name !== null);

  if (missing.length > 0) {
    throw new Error(missingAdminEnvMessage(missing));
  }

  return createClient<Database>(url!, key!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}
