import { Skeleton } from "@/components/ui/skeleton";
import {
  CREATION_LIST_GRID_CLASS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CardSkeleton({
  className,
  showMenu = false,
}: {
  className?: string;
  showMenu?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card",
        className,
      )}
      aria-busy="true"
      aria-label="Loading creation card"
    >
      <Skeleton className="aspect-[21/9] w-full rounded-none shimmer" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-6 w-3/4 shimmer md:h-7" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full shimmer" />
              <Skeleton className="h-4 w-32 shimmer" />
            </div>
          </div>
          {showMenu && (
            <Skeleton className="size-11 shrink-0 rounded-lg shimmer" />
          )}
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

export function CardListSkeleton({
  count = 4,
  className,
  showMenu = false,
}: {
  count?: number;
  className?: string;
  showMenu?: boolean;
}) {
  return (
    <div
      className={cn(CREATION_LIST_GRID_CLASS, className)}
      aria-busy="true"
      aria-label="Loading creations"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} showMenu={showMenu} />
      ))}
    </div>
  );
}

export function CreationsSectionSkeleton({
  count = 4,
  showMenu = false,
  className,
}: {
  count?: number;
  showMenu?: boolean;
  className?: string;
}) {
  return (
    <section aria-label="My Creations" className={className}>
      <Skeleton className="mb-4 h-7 w-36 shimmer md:h-8 lg:h-7" />
      <CardListSkeleton count={count} showMenu={showMenu} />
    </section>
  );
}
