"use client";

import { CREATION_CATEGORIES } from "@/features/creation/creation-options";
import type { CreationCategory } from "@/features/creation/types";
import { cn } from "@/lib/utils";

interface CategorySelectionStepProps {
  onSelect: (category: CreationCategory) => void;
}

export function CategorySelectionStep({ onSelect }: CategorySelectionStepProps) {
  return (
    <div className="flex flex-col">
      {CREATION_CATEGORIES.map((item, index) => (
        <div key={item.category}>
          {index > 0 && (
            <div
              className="my-1 border-t border-border/60"
              role="separator"
              aria-hidden
            />
          )}
          <button
            type="button"
            onClick={() => onSelect(item.category)}
            className={cn(
              "group flex w-full flex-col gap-1 rounded-xl px-3 py-4 text-left transition-colors",
              "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            )}
          >
            <span className="flex items-center gap-2 text-base font-semibold">
              <span aria-hidden>{item.emoji}</span>
              {item.title}
            </span>
            <span className="text-sm text-muted-foreground">
              {item.description}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
