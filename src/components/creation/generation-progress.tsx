"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  getCategoryAccent,
  getGenerationHeadline,
  getGenerationSubMessages,
  pickRotatingMessage,
} from "@/lib/generation-ui";
import { getGenerationProgress } from "@/lib/creation-consumption-utils";
import { triggerGenerationViaApi } from "@/lib/content/api-client";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

interface GenerationProgressProps {
  creation: Creation;
  onRetry?: () => void;
  className?: string;
}

export function GenerationProgress({
  creation,
  onRetry,
  className,
}: GenerationProgressProps) {
  const reducedMotion = useReducedMotion();
  const accent = getCategoryAccent(creation.category);
  const [tick, setTick] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const lastProgress = useRef(getGenerationProgress(creation));
  const [stalled, setStalled] = useState(false);

  const subMessages = getGenerationSubMessages(creation);
  const headline = getGenerationHeadline(creation);
  const subtext = pickRotatingMessage(subMessages, tick);
  const progress = getGenerationProgress(creation);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 4000);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  useEffect(() => {
    if (progress !== lastProgress.current) {
      lastProgress.current = progress;
      setStalled(false);
      return;
    }
    const id = window.setTimeout(() => setStalled(true), 8000);
    return () => window.clearTimeout(id);
  }, [progress, creation.updatedAt]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      if (onRetry) {
        onRetry();
      } else {
        await triggerGenerationViaApi(creation.id);
      }
    } finally {
      setRetrying(false);
    }
  };

  if (creation.status === "failed") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm font-medium text-destructive">{headline}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {creation.generationError ??
              "Something went wrong while generating this creation."}
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={handleRetry}
          disabled={retrying}
        >
          {retrying ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Retrying…
            </>
          ) : (
            "Try again"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={headline}
              className="text-sm font-medium"
              initial={reducedMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              {headline}
            </motion.p>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={subtext}
              className="mt-0.5 text-xs text-muted-foreground"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {subtext}
            </motion.p>
          </AnimatePresence>
        </div>
        {stalled && !reducedMotion && (
          <Sparkles className="size-4 shrink-0 animate-pulse text-primary" aria-hidden />
        )}
      </div>
      <div className="space-y-1">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn("h-full rounded-full", accent.progress)}
            initial={false}
            animate={{ width: `${Math.max(progress, 4)}%` }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 120, damping: 20 }
            }
          />
        </div>
        <p className="text-xs text-muted-foreground">{progress}% complete</p>
      </div>
    </div>
  );
}
