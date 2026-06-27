"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { useHomeUiStore } from "@/stores/home-ui-store";

interface NewCreationButtonProps {
  size?: "default" | "large";
  className?: string;
}

export function NewCreationButton({
  size = "default",
  className,
}: NewCreationButtonProps) {
  const reducedMotion = useReducedMotion();
  const setCreationModalOpen = useHomeUiStore((s) => s.setCreationModalOpen);

  const handleClick = () => {
    setCreationModalOpen(true);
  };

  return (
    <motion.div
      whileHover={reducedMotion ? undefined : { scale: 1.02 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
    >
      <Button
        onClick={handleClick}
        className={cn(
          "gap-2 rounded-xl bg-primary font-medium shadow-sm transition-shadow hover:shadow-md",
          size === "large" && "h-12 px-8 text-base md:h-14 md:px-10 md:text-lg",
          className,
        )}
      >
        <Sparkles className="size-4 md:size-5" aria-hidden />
        New Creation
      </Button>
    </motion.div>
  );
}
