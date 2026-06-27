import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Matches HeroSection */
export function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border/60 shadow-hero",
        className,
      )}
      aria-busy="true"
      aria-label="Loading hero section"
    >
      <div className="flex flex-col items-center gap-6 px-6 py-10 text-center md:gap-8 md:px-10 md:py-12 lg:py-14">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 shrink-0 rounded shimmer" />
          <Skeleton className="h-6 w-64 shimmer md:h-7 md:w-80 lg:h-8 lg:w-96" />
        </div>
        <Skeleton className="h-12 w-44 rounded-xl shimmer md:h-14 md:w-52" />
      </div>
    </div>
  );
}
