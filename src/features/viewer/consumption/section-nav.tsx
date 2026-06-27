"use client";

import { cn } from "@/lib/utils";

import type { ConsumptionMode } from "./consumption-mode";
import type { ConsumptionSection } from "./consumption-mode";

interface SectionNavProps {
  sections: ConsumptionSection[];
  activeIndex: number;
  mode: ConsumptionMode;
  onSelect: (index: number) => void;
  immersive?: boolean;
  className?: string;
}

export function SectionNav({
  sections,
  activeIndex,
  mode,
  onSelect,
  immersive = false,
  className,
}: SectionNavProps) {
  const label = mode === "podcast" ? "Segments" : "Chapters";

  return (
    <nav
      className={cn(
        "flex h-full flex-col border-r",
        immersive
          ? "reader-chrome border-[var(--reader-border)]"
          : "border-border/60",
        className,
      )}
      aria-label={label}
    >
      <div
        className={cn(
          "border-b px-4 py-3",
          immersive ? "border-[var(--reader-border)]" : "border-border/60",
        )}
      >
        <h2
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            immersive ? "text-[var(--reader-muted)]" : "text-muted-foreground",
          )}
        >
          {label}
        </h2>
      </div>
      <ul className="flex-1 overflow-y-auto p-2">
        {sections.map((section, index) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "mb-0.5 flex w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                index === activeIndex
                  ? immersive
                    ? "bg-[var(--reader-accent)]/15 font-medium text-[var(--reader-fg)]"
                    : "bg-primary/10 font-medium text-primary"
                  : immersive
                    ? "text-[var(--reader-muted)] hover:bg-[var(--reader-surface)] hover:text-[var(--reader-fg)]"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="line-clamp-2">{section.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
