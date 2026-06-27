"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  countActiveFilters,
  useHomeUiStore,
} from "@/stores/home-ui-store";

import { FilterForm } from "./filter-form";

interface FilterPopoverProps {
  className?: string;
}

export function FilterPopover({ className }: FilterPopoverProps) {
  const filters = useHomeUiStore((s) => s.filters);
  const isOpen = useHomeUiStore((s) => s.isFilterPopoverOpen);
  const setOpen = useHomeUiStore((s) => s.setFilterPopoverOpen);
  const activeCount = countActiveFilters(filters);

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "relative size-12 shrink-0 rounded-xl md:size-14",
              className,
            )}
            aria-label="Filter creations"
            aria-expanded={isOpen}
          />
        }
      >
        <SlidersHorizontal className="size-5" />
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {activeCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[85vh] w-80 overflow-y-auto p-4"
        align="end"
        sideOffset={8}
      >
        <h2 className="mb-4 text-sm font-semibold">Filters</h2>
        <FilterForm onApply={() => setOpen(false)} onReset={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
