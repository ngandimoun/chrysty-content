import { create } from "zustand";

import {
  DEFAULT_FILTER_STATE,
  type FilterState,
} from "@/types/filters";

interface HomeUiState {
  searchQuery: string;
  filters: FilterState;
  isFilterSheetOpen: boolean;
  isFilterPopoverOpen: boolean;
  isCreationModalOpen: boolean;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;
  setFilterSheetOpen: (open: boolean) => void;
  setFilterPopoverOpen: (open: boolean) => void;
  setCreationModalOpen: (open: boolean) => void;
}

export const useHomeUiStore = create<HomeUiState>((set) => ({
  searchQuery: "",
  filters: DEFAULT_FILTER_STATE,
  isFilterSheetOpen: false,
  isFilterPopoverOpen: false,
  isCreationModalOpen: false,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: DEFAULT_FILTER_STATE }),
  setFilterSheetOpen: (open) => set({ isFilterSheetOpen: open }),
  setFilterPopoverOpen: (open) => set({ isFilterPopoverOpen: open }),
  setCreationModalOpen: (open) => set({ isCreationModalOpen: open }),
}));

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.sort !== "recently_created") count++;
  if (filters.categories.length > 0) count++;
  if (filters.storySubtypes.length > 0) count++;
  if (filters.audiobookSubtypes.length > 0) count++;
  if (filters.podcastSubtypes.length > 0) count++;
  if (filters.statuses.length > 0) count++;
  if (filters.consumptionStatuses.length > 0) count++;
  if (filters.generationFilters.length > 0) count++;
  if (filters.created) count++;
  if (filters.storyPages && filters.storyPages !== "any") count++;
  if (filters.audioDuration && filters.audioDuration !== "any") count++;
  return count;
}
