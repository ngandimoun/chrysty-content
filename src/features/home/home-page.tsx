"use client";

import { AnimatePresence, motion } from "framer-motion";

import { CreationWizardModal } from "@/components/creation/creation-wizard-modal";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { useConsumptionRealtime } from "@/features/home/use-consumption-realtime";
import {
  useContinueCreation,
  useCreationsQuery,
  useFavorites,
  useRecentActivityQuery,
  useRecentlyPlayed,
} from "@/features/home/use-creations-query";
import { useGenerationKickoff } from "@/features/home/use-generation-kickoff";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function HomePage() {
  const reducedMotion = useReducedMotion();
  const {
    data: creations,
    allCreations,
    isLoading,
    isFetching,
    isPlaceholderData,
  } = useCreationsQuery();

  useGenerationKickoff(allCreations);
  useConsumptionRealtime();

  const { data: activities = [] } = useRecentActivityQuery();

  const showSkeleton = isLoading && !creations;
  const continueCreation = useContinueCreation(creations);
  const favorites = useFavorites(creations);
  const recentlyPlayed = useRecentlyPlayed(creations);

  return (
    <main className="min-h-screen">
      <CreationWizardModal />
      <AnimatePresence mode="wait">
        {showSkeleton ? (
          <motion.div
            key="skeleton"
            initial={false}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ResponsiveShell
              creations={[]}
              favorites={[]}
              recentlyPlayed={[]}
              activities={[]}
              isLoading
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            aria-busy={isFetching && !isPlaceholderData}
          >
            <ResponsiveShell
              creations={creations ?? []}
              continueCreation={continueCreation}
              favorites={favorites}
              recentlyPlayed={recentlyPlayed}
              activities={activities}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
