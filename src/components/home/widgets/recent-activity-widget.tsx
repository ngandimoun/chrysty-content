"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Headphones, Mic } from "lucide-react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatDistanceToNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CreationCategory, RecentActivity } from "@/types/creation";

interface RecentActivityWidgetProps {
  activities: RecentActivity[];
  className?: string;
}

function CategoryIcon({ category }: { category?: CreationCategory }) {
  const className = "size-4 shrink-0 text-muted-foreground";

  if (category === "audiobook") {
    return <Headphones className={className} aria-hidden />;
  }
  if (category === "podcast") {
    return <Mic className={className} aria-hidden />;
  }
  return <BookOpen className={className} aria-hidden />;
}

export function RecentActivityWidget({
  activities,
  className,
}: RecentActivityWidgetProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5 shadow-card",
        className,
      )}
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      aria-label="Recent activity"
    >
      <h2 className="mb-4 text-sm font-semibold">Recent Activity</h2>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Your reading and listening history will show up here.
        </p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <li key={activity.id}>
              <Link
                href={`/creations/${activity.creationId}`}
                className="flex items-start gap-3 rounded-lg p-1 transition-colors hover:bg-accent/50"
              >
                <div className="mt-0.5">
                  <CategoryIcon category={activity.category} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.action} · {formatDistanceToNow(activity.timestamp)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}
