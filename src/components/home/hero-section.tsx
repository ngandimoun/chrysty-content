"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

import { NewCreationButton } from "./new-creation-button";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      className={cn(
        "hero-glass relative overflow-hidden rounded-3xl border border-border/60 shadow-hero",
        className,
      )}
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      aria-label="Start a new creation"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.7_0.08_260/0.12),transparent_50%)]" />
      <div className="relative flex flex-col items-center gap-6 px-6 py-10 text-center md:gap-8 md:px-10 md:py-12 lg:py-14">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="size-5 text-primary" aria-hidden />
          <p className="text-base font-medium md:text-lg lg:text-xl">
            Ready to create something amazing?
          </p>
        </div>
        <NewCreationButton size="large" />
      </div>
    </motion.section>
  );
}
