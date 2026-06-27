"use client";

/**
 * Full-page viewer shell for creations. Delegates completed content to
 * ContentViewerShell. Body components are route-agnostic so a future
 * CreationPreviewSheet can mount them with variant="sheet".
 */

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { GeneratingCardArtwork } from "@/components/creation/generating-card-artwork";
import { GenerationProgress } from "@/components/creation/generation-progress";
import { ContentViewerShell } from "@/features/viewer/consumption/content-viewer-shell";
import type { CreationManifestResponse } from "@/lib/content/api-client";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

interface CreationViewerShellProps {
  creation: Creation;
  manifest?: CreationManifestResponse;
  isManifestLoading?: boolean;
  variant?: "page" | "sheet";
  onRetry?: () => void;
}

export function CreationViewerShell({
  creation,
  manifest,
  isManifestLoading,
  variant = "page",
  onRetry,
}: CreationViewerShellProps) {
  const isGenerating = creation.status === "generating";
  const isFailed = creation.status === "failed";

  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        variant === "sheet" && "min-h-0",
      )}
    >
      {isGenerating || isFailed ? (
        <>
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-8">
              <Link
                href="/"
                aria-label="Back to library"
                className="inline-flex size-9 items-center justify-center rounded-xl hover:bg-accent"
              >
                <ArrowLeft className="size-5" />
              </Link>
              <h1 className="truncate text-base font-semibold">{creation.title}</h1>
            </div>
          </header>
          <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
            <GeneratingCardArtwork creation={creation} className="rounded-2xl" />
            <GenerationProgress creation={creation} onRetry={onRetry} />
          </div>
        </>
      ) : isManifestLoading ? (
        <>
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-8">
              <Link
                href="/"
                aria-label="Back to library"
                className="inline-flex size-9 items-center justify-center rounded-xl hover:bg-accent"
              >
                <ArrowLeft className="size-5" />
              </Link>
              <h1 className="truncate text-base font-semibold">{creation.title}</h1>
            </div>
          </header>
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">Loading your creation…</p>
          </div>
        </>
      ) : manifest ? (
        <ContentViewerShell creation={creation} manifest={manifest} />
      ) : (
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
          <p>This creation is not ready to view yet.</p>
          <Link
            href="/"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Back to library
          </Link>
        </div>
      )}
    </div>
  );
}
