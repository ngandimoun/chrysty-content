"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getGenerationProgress } from "@/lib/creation-consumption-utils";
import { triggerGenerationViaApi } from "@/lib/content/api-client";
import type { Creation } from "@/types/creation";

const STALL_MS = 15_000;

function isStalled(creation: Creation, now: number): boolean {
  return now - new Date(creation.updatedAt).getTime() >= STALL_MS;
}

export function useGenerationKickoff(creations: Creation[] | undefined) {
  const queryClient = useQueryClient();
  const kickedRef = useRef<Set<string>>(new Set());
  const snapshotRef = useRef<Map<string, { updatedAt: string; progress: number }>>(
    new Map(),
  );

  useEffect(() => {
    if (!creations?.length) return;

    const generating = creations.filter((c) => c.status === "generating");
    const now = Date.now();

    for (const creation of generating) {
      const prev = snapshotRef.current.get(creation.id);
      const current = {
        updatedAt: creation.updatedAt,
        progress: getGenerationProgress(creation),
      };

      const kick = () => {
        if (kickedRef.current.has(creation.id)) return;

        kickedRef.current.add(creation.id);
        const beforeKick = { ...current };

        void triggerGenerationViaApi(creation.id)
          .then(async (result) => {
            await queryClient.invalidateQueries({ queryKey: ["creations"] });

            if (
              result.progress === beforeKick.progress &&
              result.status === "generating"
            ) {
              kickedRef.current.delete(creation.id);
            }
          })
          .catch(() => {
            kickedRef.current.delete(creation.id);
          });
      };

      if (!prev) {
        snapshotRef.current.set(creation.id, current);
        if (isStalled(creation, now)) {
          kick();
        }
        continue;
      }

      const unchanged =
        prev.updatedAt === current.updatedAt &&
        prev.progress === current.progress;

      snapshotRef.current.set(creation.id, current);

      if (!unchanged) {
        kickedRef.current.delete(creation.id);
        continue;
      }

      if (isStalled(creation, now)) {
        kick();
      }
    }

    for (const id of [...kickedRef.current]) {
      if (!generating.some((c) => c.id === id)) {
        kickedRef.current.delete(id);
      }
    }
  }, [creations, queryClient]);
}
