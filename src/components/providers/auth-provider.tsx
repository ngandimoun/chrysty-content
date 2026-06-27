"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CONTENT_KEY_HEADER, CONTENT_KEY_STORAGE } from "@/lib/content/constants";
import { getOrCreateContentKey } from "@/lib/content/identity";
import { getLoginRedirectUrl } from "@/lib/chrysty/constants";
import { configurePlatformForBrowser } from "@/lib/chrysty/platform";
import { createClient } from "@/lib/supabase/client";
import { isBrowserSupabaseConfigured } from "@/lib/supabase/browser";

interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  contentKey?: string | null;
}

interface AuthContextValue {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isBrowserSupabaseConfigured());

  const mergeProgress = useCallback(async () => {
    const contentKey = getOrCreateContentKey();
    try {
      await fetch("/api/auth/merge", {
        method: "POST",
        headers: {
          [CONTENT_KEY_HEADER]: contentKey,
        },
        credentials: "include",
      });
    } catch {
      // Non-fatal; progress remains on content_key until next merge
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isBrowserSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = (await response.json()) as AuthUser;
        if (data.contentKey) {
          window.localStorage.setItem(CONTENT_KEY_STORAGE, data.contentKey);
        }
        setUser({
          id: data.id,
          email: data.email,
          fullName: data.fullName ?? null,
          avatarUrl: data.avatarUrl ?? null,
        });
        await mergeProgress();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [mergeProgress]);

  useEffect(() => {
    configurePlatformForBrowser();
    void refreshUser();
  }, [refreshUser]);

  const signIn = useCallback(() => {
    const returnUrl =
      typeof window !== "undefined" ? window.location.href : undefined;
    window.location.href = getLoginRedirectUrl(returnUrl);
  }, []);

  const signOut = useCallback(async () => {
    if (!isBrowserSupabaseConfigured()) {
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const getAuthHeaders = useCallback(() => ({}), []);

  const value = useMemo(
    () => ({
      userId: user?.id ?? null,
      email: user?.email ?? null,
      fullName: user?.fullName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      loading,
      signIn,
      signOut,
      getAuthHeaders,
    }),
    [user, loading, signIn, signOut, getAuthHeaders],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
