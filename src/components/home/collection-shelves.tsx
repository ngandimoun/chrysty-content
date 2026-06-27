"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import { CreationCard } from "@/components/home/creation-card";
import { fetchCollectionsFromApi } from "@/lib/content/api-client";
import { cn } from "@/lib/utils";
import type { CollectionShelfId } from "@/types/consumption";

const SHELF_META: Record<
  CollectionShelfId,
  { title: string; empty: string }
> = {
  continue_reading: {
    title: "Continue Reading",
    empty: "No books in progress",
  },
  continue_listening: {
    title: "Continue Listening",
    empty: "Nothing playing yet",
  },
  unread: { title: "Unread", empty: "All caught up" },
  completed: { title: "Completed", empty: "Nothing finished yet" },
  recent: { title: "Recently Created", empty: "No creations yet" },
  favorites: { title: "Favorites", empty: "No favorites yet" },
  archived: { title: "Archived", empty: "Nothing archived" },
};

interface CollectionShelvesProps {
  shelfIds?: CollectionShelfId[];
  className?: string;
  compact?: boolean;
}

export function CollectionShelves({
  shelfIds = [
    "continue_reading",
    "continue_listening",
    "unread",
    "completed",
  ],
  className,
  compact = false,
}: CollectionShelvesProps) {
  const auth = useOptionalAuth();

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: () => fetchCollectionsFromApi(auth?.getAuthHeaders()),
  });

  if (!collections) {
    return null;
  }

  return (
    <div className={cn("space-y-8", className)}>
      {shelfIds.map((shelfId) => {
        const items = collections[shelfId] ?? [];
        const meta = SHELF_META[shelfId];
        if (items.length === 0 && compact) {
          return null;
        }

        return (
          <section key={shelfId} aria-label={meta.title}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{meta.title}</h2>
              {items.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {items.length}
                </span>
              )}
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{meta.empty}</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {items.slice(0, compact ? 4 : 8).map((creation, index) => (
                  <Link
                    key={creation.id}
                    href={`/creations/${creation.id}`}
                    className="w-[260px] shrink-0"
                  >
                    <CreationCard creation={creation} index={index} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
