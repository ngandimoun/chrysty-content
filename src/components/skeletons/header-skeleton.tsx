import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Matches Header */
export function HeaderSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("space-y-1 md:space-y-2", className)}
      aria-busy="true"
      aria-label="Loading header"
    >
      <Skeleton className="h-8 w-56 shimmer md:h-9 md:w-64 lg:h-10 lg:w-72" />
      <Skeleton className="h-4 w-64 shimmer md:h-5 md:w-72" />
    </div>
  );
}
