"use client";

import { useRef } from "react";

import type { Creation } from "@/types/creation";

import { CreationCard } from "./creation-card";
import { EmptyState } from "./empty-state";

interface CreationListProps {
  creations: Creation[];
  showHoverActions?: boolean;
  showMobileMenu?: boolean;
  className?: string;
}

export function CreationList({
  creations,
  showHoverActions = false,
  showMobileMenu = false,
  className,
}: CreationListProps) {
  // Hook point for @tanstack/react-virtual infinite scroll
  const listRef = useRef<HTMLDivElement>(null);

  if (creations.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      ref={listRef}
      className={className}
      role="list"
      aria-label="Creation cards"
    >
      {creations.map((creation, index) => (
        <div key={creation.id} role="listitem">
          <CreationCard
            creation={creation}
            index={index}
            showHoverActions={showHoverActions}
            showMobileMenu={showMobileMenu}
          />
        </div>
      ))}
    </div>
  );
}
