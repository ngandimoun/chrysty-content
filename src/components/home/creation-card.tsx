"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";

import { GeneratingCardArtwork } from "@/components/creation/generating-card-artwork";
import { CreationCoverArtwork } from "@/components/creation/creation-cover-artwork";
import { GenerationProgress } from "@/components/creation/generation-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { triggerGenerationViaApi } from "@/lib/content/api-client";
import {
  formatConsumptionLabel,
  getGenerationProgress,
  getSmartCta,
} from "@/lib/creation-consumption-utils";
import {
  formatCreationMeta,
  getTypeBadgeClass,
  getTypeLabel,
} from "@/lib/creation-utils";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

import { CreationCardActions } from "./creation-card-actions";
import { CreationCardMenu } from "./creation-card-menu";

interface CreationCardProps {
  creation: Creation;
  index?: number;
  showHoverActions?: boolean;
  showMobileMenu?: boolean;
  className?: string;
}

function CreationCardComponent({
  creation,
  index = 0,
  showHoverActions = false,
  showMobileMenu = false,
  className,
}: CreationCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const reducedMotion = useReducedMotion();

  const isGenerating = creation.status === "generating";
  const isFailed = creation.status === "failed";
  const isCompleted = creation.status === "completed";

  const handlePrimaryAction = async () => {
    if (isCompleted) {
      router.push(`/creations/${creation.id}`);
      return;
    }
    if (isFailed) {
      setRetrying(true);
      try {
        await triggerGenerationViaApi(creation.id);
        await queryClient.invalidateQueries({ queryKey: ["creations"] });
      } finally {
        setRetrying(false);
      }
    }
  };

  return (
    <motion.article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-shadow",
        "hover:shadow-card-hover",
        isGenerating && "ring-1 ring-primary/20",
        className,
      )}
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: reducedMotion ? 0 : index * 0.05,
        ease: "easeOut",
      }}
      whileHover={reducedMotion ? undefined : { y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {isGenerating || isFailed ? (
        <GeneratingCardArtwork creation={creation} />
      ) : (
        <div className="relative block w-full overflow-hidden">
          <button
            type="button"
            className="relative block w-full overflow-hidden text-left"
            onClick={() => isCompleted && router.push(`/creations/${creation.id}`)}
            disabled={!isCompleted}
            aria-label={isCompleted ? `Open ${creation.title}` : undefined}
          >
            <CreationCoverArtwork
              creation={creation}
              variant="banner"
              hoverScale
              isHovered={isHovered}
              reducedMotion={reducedMotion}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden
            />
            {creation.isFavorite && (
              <div className="absolute left-3 top-3">
                <Heart
                  className="size-4 fill-rose-500 text-rose-500"
                  aria-label="Favorite"
                />
              </div>
            )}
          </button>
          {showHoverActions && (
            <motion.div
              className="absolute right-3 top-3 z-10"
              initial={false}
              animate={{
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : -4,
              }}
              transition={{ duration: 0.2 }}
            >
              <CreationCardActions creation={creation} />
            </motion.div>
          )}
        </div>
      )}

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold leading-snug tracking-tight">
              {creation.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("font-normal", getTypeBadgeClass(creation.type))}
              >
                {getTypeLabel(creation.type)}
              </Badge>
              {!isGenerating && !isFailed && (
                <span className="text-sm text-muted-foreground">
                  {isCompleted
                    ? formatConsumptionLabel(creation)
                    : formatCreationMeta(creation)}
                </span>
              )}
            </div>
            {isCompleted && creation.consumption && creation.consumption.progressPercent > 0 && creation.consumption.status !== "completed" && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${creation.consumption.progressPercent}%` }}
                />
              </div>
            )}
            {isCompleted && creation.excerpt && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {creation.excerpt}
              </p>
            )}
          </div>
          {showMobileMenu && <CreationCardMenu creation={creation} />}
        </div>

        {(isGenerating || isFailed) && (
          <GenerationProgress creation={creation} />
        )}

        <Button
          className="w-full rounded-xl"
          onClick={handlePrimaryAction}
          disabled={isGenerating || retrying}
        >
          {isGenerating || retrying ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {retrying ? "Retrying…" : "Creating…"}
            </>
          ) : isFailed ? (
            "Try again"
          ) : (
            getSmartCta(creation)
          )}
        </Button>
      </div>
    </motion.article>
  );
}

export const CreationCard = memo(CreationCardComponent);
