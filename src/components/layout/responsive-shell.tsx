"use client";

import dynamic from "next/dynamic";

import { useIsDesktop, useIsTablet } from "@/hooks/use-media-query";
import type { Creation } from "@/types/creation";
import type { RecentActivity } from "@/types/creation";

import { CreationsSectionSkeleton } from "@/components/skeletons/card-skeleton";
import { HeaderSkeleton } from "@/components/skeletons/header-skeleton";
import { HeroSkeleton } from "@/components/skeletons/hero-skeleton";
import { SearchSkeleton } from "@/components/skeletons/search-skeleton";
import { WidgetColumnSkeleton } from "@/components/skeletons/widget-skeleton";

const DesktopLayout = dynamic(
  () =>
    import("./desktop-layout").then((m) => ({ default: m.DesktopLayout })),
  { loading: () => <DesktopLayoutSkeleton /> },
);

const MobileLayout = dynamic(
  () => import("./mobile-layout").then((m) => ({ default: m.MobileLayout })),
  { loading: () => <MobileLayoutSkeleton /> },
);

export { MobileLayout as TabletLayout } from "./mobile-layout";

interface ResponsiveShellProps {
  creations: Creation[];
  continueCreation?: Creation;
  favorites: Creation[];
  recentlyPlayed: Creation[];
  activities: RecentActivity[];
  isLoading?: boolean;
}

function DesktopLayoutSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 lg:px-10 lg:py-8">
      <HeaderSkeleton />
      <HeroSkeleton />
      <SearchSkeleton />
      <div className="grid min-h-[60vh] gap-8 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px]">
        <CreationsSectionSkeleton count={4} />
        <WidgetColumnSkeleton />
      </div>
    </div>
  );
}

function MobileLayoutSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 md:max-w-none md:space-y-8 md:px-8 md:py-8">
      <HeaderSkeleton />
      <HeroSkeleton />
      <SearchSkeleton />
      <CreationsSectionSkeleton count={3} showMenu />
    </div>
  );
}

export function ResponsiveShell({
  creations,
  continueCreation,
  favorites,
  recentlyPlayed,
  activities,
  isLoading,
}: ResponsiveShellProps) {
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();

  if (isLoading) {
    return isDesktop ? <DesktopLayoutSkeleton /> : <MobileLayoutSkeleton />;
  }

  const layoutProps = {
    creations,
    continueCreation,
    favorites,
    recentlyPlayed,
    activities,
    usePopoverFilters: isDesktop || isTablet,
  };

  if (isDesktop) {
    return <DesktopLayout {...layoutProps} />;
  }

  return <MobileLayout {...layoutProps} />;
}
