import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { ContinueWidgetSkeleton } from "./featured-skeleton";

/** Matches RecentActivityWidget */
export function RecentActivityWidgetSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5 shadow-card",
        className,
      )}
      aria-busy="true"
      aria-label="Loading recent activity"
    >
      <Skeleton className="mb-4 h-5 w-32 shimmer" />
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-start gap-3">
            <Skeleton className="mt-1.5 size-2 shrink-0 rounded-full shimmer" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 shimmer" />
              <Skeleton className="h-3 w-1/2 shimmer" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Matches FavoritesWidget */
export function FavoritesWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5 shadow-card",
        className,
      )}
      aria-busy="true"
      aria-label="Loading favorites"
    >
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="size-4 rounded-sm shimmer" />
        <Skeleton className="h-5 w-24 shimmer" />
      </div>
      <ul className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl p-2">
            <Skeleton className="size-10 shrink-0 rounded-lg shimmer" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 shimmer" />
              <Skeleton className="h-3 w-16 shimmer" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Matches RecentlyPlayedWidget */
export function RecentlyPlayedWidgetSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5 shadow-card",
        className,
      )}
      aria-busy="true"
      aria-label="Loading recently played"
    >
      <Skeleton className="mb-4 h-5 w-32 shimmer" />
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex w-24 shrink-0 flex-col gap-2">
            <Skeleton className="aspect-square w-full rounded-xl shimmer" />
            <Skeleton className="h-3 w-full shimmer" />
            <Skeleton className="h-2.5 w-2/3 shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WidgetColumnSkeleton({ className }: { className?: string }) {
  return (
    <aside className={cn("space-y-4", className)} aria-busy="true" aria-label="Loading widgets">
      <ContinueWidgetSkeleton />
      <RecentActivityWidgetSkeleton />
      <FavoritesWidgetSkeleton />
      <RecentlyPlayedWidgetSkeleton />
    </aside>
  );
}

/** @deprecated Use RecentActivityWidgetSkeleton */
export const WidgetSkeleton = RecentActivityWidgetSkeleton;
