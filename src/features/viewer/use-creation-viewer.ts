"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchCreationDetail,
  fetchCreationManifest,
  type CreationManifestResponse,
} from "@/lib/content/api-client";
import type { Creation } from "@/types/creation";

export function useCreationViewer(creationId: string) {
  const detailQuery = useQuery({
    queryKey: ["creation", creationId],
    queryFn: () => fetchCreationDetail(creationId),
    refetchOnMount: "always",
    refetchInterval: (query) =>
      query.state.data?.status === "generating" ? 3000 : false,
  });

  const manifestQuery = useQuery({
    queryKey: ["creation-manifest", creationId],
    queryFn: () => fetchCreationManifest(creationId),
    enabled: detailQuery.data?.status === "completed",
    retry: 1,
  });

  return {
    creation: detailQuery.data,
    manifest: manifestQuery.data as CreationManifestResponse | undefined,
    isLoading: detailQuery.isLoading,
    isManifestLoading: manifestQuery.isLoading,
    error: detailQuery.error ?? manifestQuery.error,
    refetch: () => {
      void detailQuery.refetch();
      void manifestQuery.refetch();
    },
  };
}

export type { Creation };
