import type { StoryPlan } from "@/types/content-metadata";

export function maxIllustrationSlots(
  pageCount: number,
  audience: string,
): number {
  if (audience === "kids") {
    return Math.max(1, Math.ceil(pageCount / 4));
  }
  return Math.max(1, Math.ceil(pageCount / 5));
}

function computeIdealPositions(pageCount: number, cap: number): number[] {
  if (cap === 0) {
    return [];
  }

  const start = 2;
  const end = pageCount;
  const span = end - start + 1;

  if (cap >= span) {
    return Array.from({ length: span }, (_, index) => start + index);
  }

  const positions: number[] = [];
  for (let index = 0; index < cap; index += 1) {
    positions.push(
      Math.round(start + (index * (span - 1)) / Math.max(cap - 1, 1)),
    );
  }
  return positions;
}

function spacingScore(pageNumber: number, ideals: number[]): number {
  if (ideals.length === 0) {
    return 0;
  }

  const minDistance = Math.min(
    ...ideals.map((ideal) => Math.abs(pageNumber - ideal)),
  );
  return 100 - minDistance;
}

function layoutWithoutSlot(
  layout: StoryPlan["pages"][number]["layout"],
): StoryPlan["pages"][number]["layout"] {
  if (layout === "title") {
    return "title";
  }
  return "text_only";
}

export function normalizeStoryPlanSlots(plan: StoryPlan): StoryPlan {
  const cap = maxIllustrationSlots(plan.pageCount, plan.audience);
  const pages = plan.pages.map((page) => ({
    ...page,
    slots: [...page.slots],
  }));

  for (const page of pages) {
    if (page.pageNumber === 1) {
      page.slots = [];
      page.layout = "title";
    } else if (page.slots.length > 1) {
      page.slots = [page.slots[0]!];
    }
  }

  type SlotCandidate = {
    pageNumber: number;
    layout: StoryPlan["pages"][number]["layout"];
    slot: StoryPlan["pages"][number]["slots"][number];
  };

  const candidates: SlotCandidate[] = [];
  for (const page of pages) {
    for (const slot of page.slots) {
      candidates.push({
        pageNumber: page.pageNumber,
        layout: page.layout,
        slot,
      });
    }
  }

  if (candidates.length <= cap) {
    return { ...plan, pages };
  }

  const idealPositions = computeIdealPositions(plan.pageCount, cap);
  const scored = candidates.map((candidate) => ({
    ...candidate,
    score:
      (candidate.layout === "text_with_hero" ? 1000 : 0) +
      spacingScore(candidate.pageNumber, idealPositions),
  }));

  scored.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.pageNumber - right.pageNumber;
  });

  const keepPages = new Set(
    scored.slice(0, cap).map((candidate) => candidate.pageNumber),
  );

  for (const page of pages) {
    if (page.pageNumber === 1) {
      continue;
    }

    if (!keepPages.has(page.pageNumber)) {
      page.slots = [];
      page.layout = layoutWithoutSlot(page.layout);
    }
  }

  return { ...plan, pages };
}
