"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { CreationCoverArtwork } from "@/components/creation/creation-cover-artwork";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getTypeLabel } from "@/lib/creation-utils";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

interface RecentlyPlayedWidgetProps {
  items: Creation[];
  className?: string;
}

export function RecentlyPlayedWidget({
  items,
  className,
}: RecentlyPlayedWidgetProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  if (items.length === 0) return null;

  return (
    <motion.section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5 shadow-card",
        className,
      )}
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      aria-label="Recently played"
    >
      <h2 className="mb-4 text-sm font-semibold">Recently Played</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {items.map((creation) => (
            <button
              key={creation.id}
              type="button"
              className="group flex w-24 shrink-0 flex-col gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => router.push(`/creations/${creation.id}`)}
            >
              <CreationCoverArtwork
                creation={creation}
                variant="square"
                className="transition-transform group-hover:scale-105"
              />
              <span className="truncate text-xs font-medium">
                {creation.title}
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                {getTypeLabel(creation.type)}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </motion.section>
  );
}
