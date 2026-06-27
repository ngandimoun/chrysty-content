"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

import { CreationCoverArtwork } from "@/components/creation/creation-cover-artwork";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getTypeLabel } from "@/lib/creation-utils";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

interface FavoritesWidgetProps {
  favorites: Creation[];
  className?: string;
}

export function FavoritesWidget({
  favorites,
  className,
}: FavoritesWidgetProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  if (favorites.length === 0) return null;

  return (
    <motion.section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5 shadow-card",
        className,
      )}
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      aria-label="Favorites"
    >
      <div className="mb-4 flex items-center gap-2">
        <Heart className="size-4 text-rose-500" aria-hidden />
        <h2 className="text-sm font-semibold">Favorites</h2>
      </div>
      <ul className="space-y-2">
        {favorites.map((creation) => (
          <li key={creation.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => router.push(`/creations/${creation.id}`)}
            >
              <CreationCoverArtwork creation={creation} variant="thumb" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{creation.title}</p>
                <p className="text-xs text-muted-foreground">
                  {getTypeLabel(creation.type)}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
