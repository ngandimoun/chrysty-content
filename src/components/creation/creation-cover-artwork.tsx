"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { creationArtworkClass } from "@/lib/creation-utils";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

export type CreationCoverVariant = "banner" | "square" | "thumb";

interface CreationCoverArtworkProps {
  creation: Creation;
  variant?: CreationCoverVariant;
  className?: string;
  hoverScale?: boolean;
  isHovered?: boolean;
  reducedMotion?: boolean;
  animated?: boolean;
}

const VARIANT_CLASS: Record<CreationCoverVariant, string> = {
  banner: "aspect-[21/9] w-full",
  square: "aspect-square w-full",
  thumb: "size-10 shrink-0",
};

export function CreationCoverArtwork({
  creation,
  variant = "banner",
  className,
  hoverScale = false,
  isHovered = false,
  reducedMotion = false,
  animated = false,
}: CreationCoverArtworkProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showCover = Boolean(creation.coverUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [creation.coverUrl]);

  const gradientClass = cn(
    "absolute inset-0",
    creationArtworkClass(creation),
    hoverScale &&
      isHovered &&
      !reducedMotion &&
      "transition-transform duration-300 scale-[1.02]",
  );

  const imageClass = cn(
    "absolute inset-0 size-full object-cover object-center",
    hoverScale &&
      isHovered &&
      !reducedMotion &&
      "transition-transform duration-300 scale-[1.02]",
  );

  const containerClass = cn(
    "relative overflow-hidden",
    VARIANT_CLASS[variant],
    variant === "thumb" && "rounded-lg",
    variant === "square" && "rounded-xl",
    className,
  );

  const imageElement = showCover && creation.coverUrl && (
    animated ? (
      <motion.img
        key={creation.coverUrl}
        src={creation.coverUrl}
        alt=""
        className={imageClass}
        initial={reducedMotion ? false : { opacity: 0, scale: 1.05, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        onError={() => setImageFailed(true)}
      />
    ) : (
      <img
        src={creation.coverUrl}
        alt=""
        className={imageClass}
        onError={() => setImageFailed(true)}
      />
    )
  );

  return (
    <div className={containerClass}>
      <div className={gradientClass} aria-hidden />
      {imageElement}
    </div>
  );
}
