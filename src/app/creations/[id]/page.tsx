"use client";

import { use } from "react";

import { CreationViewerShell } from "@/features/viewer/creation-viewer-shell";
import { useCreationViewer } from "@/features/viewer/use-creation-viewer";
import { triggerGenerationViaApi } from "@/lib/content/api-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CreationViewerPage({ params }: PageProps) {
  const { id } = use(params);
  const { creation, manifest, isLoading, isManifestLoading, refetch } =
    useCreationViewer(id);

  if (isLoading || !creation) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <CreationViewerShell
      creation={creation}
      manifest={manifest}
      isManifestLoading={isManifestLoading}
      onRetry={async () => {
        await triggerGenerationViaApi(id);
        refetch();
      }}
    />
  );
}
