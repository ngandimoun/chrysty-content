"use client";

import { CollectionShelves } from "@/components/home/collection-shelves";
import { Header } from "@/components/home/header";
import { HeroSection } from "@/components/home/hero-section";
import { SearchBar } from "@/components/home/search-bar";
import { FilterPopover } from "@/components/home/filter-popover";
import { FilterSheet } from "@/components/home/filter-sheet";
import { CreationList } from "@/components/home/creation-list";
import { ContinueWidget } from "@/components/home/widgets/continue-widget";
import { RecentActivityWidget } from "@/components/home/widgets/recent-activity-widget";
import { FavoritesWidget } from "@/components/home/widgets/favorites-widget";
import { RecentlyPlayedWidget } from "@/components/home/widgets/recently-played-widget";
import {
  CREATION_LIST_GRID_CLASS,
  CREATION_SECTION_HEADING_CLASS,
} from "@/lib/constants";
import type { Creation, RecentActivity } from "@/types/creation";

interface DesktopLayoutProps {
  creations: Creation[];
  continueCreation?: Creation;
  favorites: Creation[];
  recentlyPlayed: Creation[];
  activities: RecentActivity[];
  usePopoverFilters?: boolean;
}

export function DesktopLayout({
  creations,
  continueCreation,
  favorites,
  recentlyPlayed,
  activities,
  usePopoverFilters = true,
}: DesktopLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 lg:px-10 lg:py-8">
      <Header />
      <HeroSection />
      <SearchBar
        filterTrigger={
          usePopoverFilters ? <FilterPopover /> : <FilterSheet />
        }
      />

      <CollectionShelves compact className="hidden lg:block" />

      <div className="grid min-h-[60vh] gap-8 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px]">
        <section aria-label="My Creations" className="min-w-0">
          <h2 className={CREATION_SECTION_HEADING_CLASS}>
            My Creations
          </h2>
          <CreationList
            creations={creations}
            showHoverActions
            className={CREATION_LIST_GRID_CLASS}
          />
        </section>

        <aside className="space-y-4" aria-label="Widgets">
          <ContinueWidget creation={continueCreation} />
          <RecentActivityWidget activities={activities} />
          <FavoritesWidget favorites={favorites} />
          <RecentlyPlayedWidget items={recentlyPlayed} />
        </aside>
      </div>
    </div>
  );
}
