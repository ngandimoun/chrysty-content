"use client";

import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import {
  fetchCreationsFromApi,
  fetchRecentActivityFromApi,
} from "@/lib/content/api-client";
import {
  fetchCreations as fetchMockCreations,
  fetchRecentActivity as fetchMockRecentActivity,
} from "@/lib/mock/creations";
import { useHomeUiStore } from "@/stores/home-ui-store";
import type { Creation } from "@/types/creation";
import type { FilterState } from "@/types/filters";

async function loadCreations(authHeaders?: Record<string, string>): Promise<Creation[]> {
  try {
    return await fetchCreationsFromApi(authHeaders);
  } catch {
    return fetchMockCreations();
  }
}

async function loadRecentActivity(authHeaders?: Record<string, string>) {
  try {
    return await fetchRecentActivityFromApi(authHeaders);
  } catch {
    return fetchMockRecentActivity();
  }
}

function matchesAudioDuration(
  creation: Creation,
  duration: FilterState["audioDuration"],
): boolean {
  if (!duration || duration === "any") return true;
  const minutes = creation.durationMinutes ?? 0;
  if (duration === "under_5") return minutes > 0 && minutes < 5;
  if (duration === "5_to_15") return minutes >= 5 && minutes <= 15;
  if (duration === "over_15") return minutes > 15;
  return true;
}

function matchesStoryPages(
  creation: Creation,
  pages: FilterState["storyPages"],
): boolean {
  if (!pages || pages === "any") return true;
  const count = creation.pageCount ?? 0;
  if (pages === "5") return count >= 1 && count <= 5;
  if (pages === "10") return count >= 6 && count <= 10;
  if (pages === "15") return count >= 11 && count <= 15;
  return true;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function matchesCreated(
  creation: Creation,
  filters: FilterState,
): boolean {
  if (!filters.created) {
    if (!filters.createdFrom && !filters.createdTo) {
      return true;
    }
  }

  const created = new Date(creation.createdAt);
  const now = new Date();

  if (filters.created === "today") {
    return created >= startOfDay(now) && created <= endOfDay(now);
  }

  if (filters.created === "this_week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= startOfDay(weekAgo);
  }

  if (filters.created === "this_month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return created >= startOfDay(monthAgo);
  }

  if (filters.createdFrom) {
    const from = startOfDay(new Date(filters.createdFrom));
    if (created < from) return false;
  }

  if (filters.createdTo) {
    const to = endOfDay(new Date(filters.createdTo));
    if (created > to) return false;
  }

  return true;
}

function applyFiltersAndSearch(
  creations: Creation[],
  searchQuery: string,
  filters: FilterState,
): Creation[] {
  let result = [...creations];

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.topic?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.tags?.some((t) => t.toLowerCase().includes(query)),
    );
  }

  if (filters.categories.length > 0) {
    result = result.filter((c) => filters.categories.includes(c.category));
  }

  if (filters.storySubtypes.length > 0) {
    result = result.filter(
      (c) =>
        c.category !== "story" ||
        (c.contentSubtype &&
          filters.storySubtypes.includes(c.contentSubtype)),
    );
  }

  if (filters.audiobookSubtypes.length > 0) {
    result = result.filter(
      (c) =>
        c.category !== "audiobook" ||
        (c.contentSubtype &&
          filters.audiobookSubtypes.includes(c.contentSubtype)),
    );
  }

  if (filters.podcastSubtypes.length > 0) {
    result = result.filter(
      (c) =>
        c.category !== "podcast" ||
        (c.contentSubtype &&
          filters.podcastSubtypes.includes(c.contentSubtype)),
    );
  }

  if (filters.statuses.length > 0) {
    result = result.filter((c) => filters.statuses.includes(c.status));
  } else {
    result = result.filter((c) => c.status !== "archived");
  }

  if (filters.consumptionStatuses.length > 0) {
    result = result.filter((c) => {
      const status = c.consumption?.status ?? "not_started";
      return filters.consumptionStatuses.includes(status);
    });
  }

  if (filters.generationFilters.includes("ready")) {
    result = result.filter(
      (c) =>
        c.status === "completed" &&
        (!c.consumption || c.consumption.status === "not_started"),
    );
  }

  result = result.filter((c) => matchesCreated(c, filters));
  result = result.filter((c) => matchesStoryPages(c, filters.storyPages));
  result = result.filter((c) => matchesAudioDuration(c, filters.audioDuration));

  if (filters.sort === "alphabetical") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else if (filters.sort === "last_opened") {
    result.sort(
      (a, b) =>
        new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime(),
    );
  } else if (filters.sort === "recently_updated") {
    result.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  } else if (filters.sort === "favorites") {
    result.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));
  } else {
    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return result;
}

export function useCreationsQuery() {
  const auth = useOptionalAuth();
  const searchQuery = useHomeUiStore((s) => s.searchQuery);
  const filters = useHomeUiStore((s) => s.filters);
  const authHeaders = auth?.getAuthHeaders();

  const query = useQuery({
    queryKey: ["creations", auth?.userId ?? "anon"],
    queryFn: () => loadCreations(authHeaders),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    refetchInterval: (q) =>
      q.state.data?.some((creation) => creation.status === "generating")
        ? 3000
        : false,
  });

  const data = useMemo(
    () => applyFiltersAndSearch(query.data ?? [], searchQuery, filters),
    [query.data, searchQuery, filters],
  );

  return { ...query, data, allCreations: query.data };
}

export function useRecentActivityQuery() {
  const auth = useOptionalAuth();
  return useQuery({
    queryKey: ["recent-activity", auth?.userId ?? "anon"],
    queryFn: () => loadRecentActivity(auth?.getAuthHeaders()),
  });
}

export function useContinueCreation(creations: Creation[] | undefined) {
  if (!creations?.length) return undefined;

  const generating = creations.find((c) => c.status === "generating");
  if (generating) return generating;

  const inProgress = creations
    .filter(
      (c) =>
        c.status === "completed" &&
        c.consumption &&
        (c.consumption.status === "in_progress" ||
          c.consumption.status === "abandoned"),
    )
    .sort(
      (a, b) =>
        new Date(b.consumption!.lastOpenedAt ?? b.lastOpenedAt).getTime() -
        new Date(a.consumption!.lastOpenedAt ?? a.lastOpenedAt).getTime(),
    );

  if (inProgress.length > 0) {
    return inProgress[0];
  }

  return (
    creations.find(
      (c) =>
        c.status === "completed" &&
        (!c.consumption || c.consumption.status === "not_started"),
    ) ?? creations[0]
  );
}

export function useFavorites(creations: Creation[] | undefined) {
  return creations?.filter((c) => c.isFavorite).slice(0, 4) ?? [];
}

export function useRecentlyPlayed(creations: Creation[] | undefined) {
  return (
    creations
      ?.filter(
        (c) =>
          (c.category === "audiobook" || c.category === "podcast") &&
          c.consumption &&
          c.consumption.lastOpenedAt,
      )
      .sort(
        (a, b) =>
          new Date(b.consumption!.lastOpenedAt ?? b.lastOpenedAt).getTime() -
          new Date(a.consumption!.lastOpenedAt ?? a.lastOpenedAt).getTime(),
      )
      .slice(0, 6) ?? []
  );
}
