"use client";

import { CollectionShelves } from "@/components/home/collection-shelves";
import { ContinueWidget } from "@/components/home/widgets/continue-widget";
import { Header } from "@/components/home/header";
import { HeroSection } from "@/components/home/hero-section";
import { SearchBar } from "@/components/home/search-bar";
import { FilterPopover } from "@/components/home/filter-popover";
import { FilterSheet } from "@/components/home/filter-sheet";
import { CreationList } from "@/components/home/creation-list";
import {
  CREATION_LIST_GRID_CLASS,
  CREATION_SECTION_HEADING_CLASS,
} from "@/lib/constants";
import type { Creation, RecentActivity } from "@/types/creation";

interface MobileLayoutProps {
  creations: Creation[];
  continueCreation?: Creation;
  favorites: Creation[];
  recentlyPlayed: Creation[];
  activities: RecentActivity[];
  usePopoverFilters?: boolean;
}

export function MobileLayout({
  creations,
  continueCreation,
  usePopoverFilters = false,
}: MobileLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 md:max-w-none md:space-y-8 md:px-8 md:py-8">
      <Header className="md:space-y-2" />
      <HeroSection />
      <SearchBar
        filterTrigger={
          usePopoverFilters ? <FilterPopover /> : <FilterSheet />
        }
      />

      <ContinueWidget creation={continueCreation} />

      <CollectionShelves compact shelfIds={["continue_reading", "continue_listening", "unread"]} />

      <section aria-label="My Creations">
        <h2 className={CREATION_SECTION_HEADING_CLASS}>
          My Creations
        </h2>
        <CreationList
          creations={creations}
          showMobileMenu
          className={CREATION_LIST_GRID_CLASS}
        />
      </section>
    </div>
  );
}
