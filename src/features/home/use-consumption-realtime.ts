"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured,
} from "@/lib/supabase/browser";

export function useConsumptionRealtime() {
  const queryClient = useQueryClient();
  const auth = useOptionalAuth();
  const userId = auth?.userId;

  useEffect(() => {
    if (!userId || !isBrowserSupabaseConfigured()) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`consumption-progress-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_consumption_progress",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["creations"] });
          void queryClient.invalidateQueries({ queryKey: ["collections"] });
          void queryClient.invalidateQueries({ queryKey: ["consumption"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
