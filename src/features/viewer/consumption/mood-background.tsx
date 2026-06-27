"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { VisualTheme } from "@/types/content-metadata";

const MoodSceneR3f = dynamic(
  () => import("./mood-scene-r3f").then((m) => m.MoodSceneR3f),
  { ssr: false },
);

interface MoodBackgroundProps {
  theme: VisualTheme;
  playing?: boolean;
  audioEnergy?: number;
  coverPalette?: [string, string, string] | null;
  className?: string;
}

function AmbienceLayer({
  ambience,
  playing,
}: {
  ambience?: VisualTheme["ambience"];
  playing: boolean;
}) {
  if (!ambience || ambience === "none") return null;

  const className = {
    rain: "consumption-rain",
    fog: "consumption-fog",
    particles: "consumption-particles",
    liquid: "consumption-liquid",
    space: "consumption-space",
    "warm-glow": "consumption-warm-glow",
  }[ambience];

  if (!className) return null;

  return (
    <div
      className={cn(
        "absolute inset-0",
        className,
        ambience === "particles" && !playing && "opacity-20",
      )}
    />
  );
}

export function MoodBackground({
  theme,
  playing = false,
  audioEnergy = 0,
  coverPalette,
  className,
}: MoodBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const [primary, secondary, accent] = coverPalette ?? theme.colors;
  const intensity = playing ? 0.3 + audioEnergy * 0.5 : 0.2;
  const useR3f = theme.visualStyle === "r3f" && !reducedMotion;

  if (useR3f) {
    return (
      <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
        <MoodSceneR3f
          colors={coverPalette ?? theme.colors}
          energy={theme.energy}
          playing={playing}
          audioEnergy={audioEnergy}
        />
        <AmbienceLayer ambience={theme.ambience} playing={playing} />
      </div>
    );
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
      style={
        {
          "--mood-primary": primary,
          "--mood-secondary": secondary,
          "--mood-accent": accent,
        } as React.CSSProperties
      }
    >
      <motion.div
        className="absolute -inset-[20%] opacity-60"
        style={{
          background:
            theme.visualStyle === "minimal"
              ? `linear-gradient(180deg, ${primary}12 0%, transparent 100%)`
              : theme.visualStyle === "gradient"
                ? `linear-gradient(135deg, ${primary}55, ${secondary}44, ${accent}33)`
                : `radial-gradient(ellipse at 30% 20%, ${primary}${Math.round(intensity * 255).toString(16).padStart(2, "0")} 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, ${secondary}${Math.round(intensity * 200).toString(16).padStart(2, "0")} 0%, transparent 45%),
            radial-gradient(ellipse at 50% 50%, ${accent}18 0%, transparent 60%)`,
        }}
        animate={
          reducedMotion || !playing
            ? undefined
            : {
                scale: [1, 1.05, 1],
                rotate: [0, 1, 0],
              }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <AmbienceLayer ambience={theme.ambience} playing={playing} />
    </div>
  );
}
