import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Matches ContinueWidget layout */
export function ContinueWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card",
        className,
      )}
      aria-busy="true"
      aria-label="Loading continue widget"
    >
      <div className="relative aspect-[21/9] overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none shimmer" />
        <div className="absolute bottom-0 left-0 right-0 space-y-2 p-5">
          <Skeleton className="h-3 w-40 shimmer opacity-80" />
          <Skeleton className="h-7 w-2/3 shimmer opacity-80" />
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full shimmer" />
          <Skeleton className="h-4 w-36 shimmer" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-2 w-full rounded-full shimmer" />
          <Skeleton className="h-3 w-24 shimmer" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl shimmer" />
      </div>
    </div>
  );
}

/** @deprecated Use ContinueWidgetSkeleton */
export const FeaturedSkeleton = ContinueWidgetSkeleton;
