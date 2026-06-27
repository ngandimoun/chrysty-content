"use client";

import { motion } from "framer-motion";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

import { NewCreationButton } from "./new-creation-button";

interface EmptyStateProps {
  className?: string;
}

function EmptyIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto h-32 w-40 text-muted-foreground/40 md:h-40 md:w-48"
      aria-hidden
    >
      <rect
        x="40"
        y="30"
        width="120"
        height="90"
        rx="12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M40 60h120"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="70" cy="45" r="6" fill="currentColor" opacity="0.5" />
      <circle cx="90" cy="45" r="6" fill="currentColor" opacity="0.3" />
      <rect
        x="55"
        y="75"
        width="90"
        height="6"
        rx="3"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="55"
        y="90"
        width="70"
        height="6"
        rx="3"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="55"
        y="105"
        width="80"
        height="6"
        rx="3"
        fill="currentColor"
        opacity="0.15"
      />
    </svg>
  );
}

export function EmptyState({ className }: EmptyStateProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center md:py-20",
        className,
      )}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <EmptyIllustration />
      <h3 className="mt-6 text-lg font-semibold md:text-xl">Nothing here yet.</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground md:text-base">
        Your creations will appear here.
      </p>
      <div className="mt-8">
        <NewCreationButton size="large" />
      </div>
    </motion.div>
  );
}
