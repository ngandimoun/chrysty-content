"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { GeneratingCardArtwork } from "@/components/creation/generating-card-artwork";
import { CreationCoverArtwork } from "@/components/creation/creation-cover-artwork";
import { GenerationProgress } from "@/components/creation/generation-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  formatConsumptionLabel,
  getSmartCta,
} from "@/lib/creation-consumption-utils";
import {
  getTypeBadgeClass,
  getTypeLabel,
} from "@/lib/creation-utils";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

interface ContinueWidgetProps {
  creation?: Creation;
  className?: string;
}

export function ContinueWidget({ creation, className }: ContinueWidgetProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  if (!creation) return null;

  const isGenerating = creation.status === "generating";
  const isFailed = creation.status === "failed";
  const consumption = creation.consumption;

  const handleContinue = () => {
    if (creation.status === "completed") {
      router.push(`/creations/${creation.id}`);
    }
  };

  return (
    <motion.section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card",
        isGenerating && "ring-1 ring-primary/20",
        className,
      )}
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      aria-label="Continue where you left off"
    >
      {isGenerating || isFailed ? (
        <GeneratingCardArtwork creation={creation} />
      ) : (
        <div className="relative overflow-hidden">
          <CreationCoverArtwork creation={creation} variant="banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">
              Continue Where You Left Off
            </p>
            <h3 className="mt-1 text-xl font-semibold">{creation.title}</h3>
          </div>
        </div>
      )}

      <div className="space-y-4 p-5">
        {(isGenerating || isFailed) && (
          <>
            <h3 className="text-base font-semibold">{creation.title}</h3>
            <GenerationProgress creation={creation} />
          </>
        )}

        {!isGenerating && !isFailed && (
          <>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("font-normal", getTypeBadgeClass(creation.type))}
              >
                {getTypeLabel(creation.type)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatConsumptionLabel(creation)}
              </span>
            </div>
            {consumption &&
              consumption.progressPercent > 0 &&
              consumption.status !== "completed" && (
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${consumption.progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(consumption.progressPercent)}% complete
                </p>
              </div>
            )}
          </>
        )}

        <Button
          className="w-full rounded-xl"
          onClick={handleContinue}
          disabled={isGenerating || isFailed}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creating…
            </>
          ) : (
            getSmartCta(creation)
          )}
        </Button>
      </div>
    </motion.section>
  );
}
