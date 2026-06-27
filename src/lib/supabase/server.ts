import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { getServerSession } from "@/lib/chrysty/server-session";
import type { Database } from "@/lib/supabase/database.types";

async function getUserIdFromBearerToken(token: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

export async function getUserIdFromRequest(
  request: Request,
): Promise<string | null> {
  const authHeader = request.headers.get("authorization")?.trim();
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) {
      const userId = await getUserIdFromBearerToken(token);
      if (userId) {
        return userId;
      }
    }
  }

  try {
    const session = await getServerSession(request as NextRequest);
    return session?.user.id ?? null;
  } catch {
    return null;
  }
}

export async function getAccessTokenFromRequest(
  request: Request,
): Promise<string | null> {
  const authHeader = request.headers.get("authorization")?.trim();
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) {
      return token;
    }
  }

  try {
    const session = await getServerSession(request as NextRequest);
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}
