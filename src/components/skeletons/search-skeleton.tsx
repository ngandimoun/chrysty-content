import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Matches SearchBar + filter trigger */
export function SearchSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex gap-3", className)}
      aria-busy="true"
      aria-label="Loading search"
    >
      <div className="relative flex h-12 flex-1 items-center rounded-xl border border-border/60 bg-card md:h-14">
        <Skeleton className="absolute left-4 size-5 rounded shimmer" />
        <Skeleton className="ml-12 mr-4 h-4 flex-1 rounded shimmer" />
      </div>
      <Skeleton className="size-12 shrink-0 rounded-xl shimmer md:size-14" />
    </div>
  );
}
