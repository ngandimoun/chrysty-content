"use client";

import { motion } from "framer-motion";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface CoverArtMotionProps {
  coverUrl?: string;
  playing?: boolean;
  glowColor?: string;
  className?: string;
}

export function CoverArtMotion({
  coverUrl,
  playing = false,
  glowColor = "#6E8BFF",
  className,
}: CoverArtMotionProps) {
  const reducedMotion = useReducedMotion();

  if (!coverUrl) return null;

  return (
    <motion.div
      className={cn("relative overflow-hidden rounded-xl", className)}
      animate={
        reducedMotion || !playing
          ? { scale: 1 }
          : { scale: [1, 1.03, 1], rotate: [0, 0.5, 0] }
      }
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{
        boxShadow: playing
          ? `0 0 40px ${glowColor}55, 0 8px 32px ${glowColor}33`
          : undefined,
      }}
    >
      <img src={coverUrl} alt="" className="size-full object-cover" />
    </motion.div>
  );
}
