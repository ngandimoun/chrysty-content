"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  countActiveFilters,
  useHomeUiStore,
} from "@/stores/home-ui-store";

import { FilterForm } from "./filter-form";

interface FilterSheetProps {
  className?: string;
}

export function FilterSheet({ className }: FilterSheetProps) {
  const filters = useHomeUiStore((s) => s.filters);
  const isOpen = useHomeUiStore((s) => s.isFilterSheetOpen);
  const setOpen = useHomeUiStore((s) => s.setFilterSheetOpen);
  const activeCount = countActiveFilters(filters);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "relative size-12 shrink-0 rounded-xl md:size-14",
          className,
        )}
        onClick={() => setOpen(true)}
        aria-label="Filter creations"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal className="size-5" />
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8 pt-2">
            <FilterForm
              onApply={() => setOpen(false)}
              onReset={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
