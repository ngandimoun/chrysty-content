import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { StoryPlan } from "@/types/content-metadata";

import {
  maxIllustrationSlots,
  normalizeStoryPlanSlots,
} from "./story-slots";

function makePlan(overrides: Partial<StoryPlan> = {}): StoryPlan {
  return {
    title: "Test Story",
    pageCount: 10,
    audience: "kids",
    illustrationStyle: "watercolor",
    characterBible: "Hero: brave kid",
    pages: Array.from({ length: 10 }, (_, index) => ({
      pageNumber: index + 1,
      layout: index === 0 ? "title" : "text_with_inline",
      summary: `Page ${index + 1}`,
      slots:
        index === 0
          ? [
              {
                slotId: "illus_p1_s1",
                type: "illustration" as const,
                briefHint: "title scene",
              },
            ]
          : [
              {
                slotId: `illus_p${index + 1}_s1`,
                type: "illustration" as const,
                briefHint: `scene ${index + 1}`,
              },
            ],
    })),
    ...overrides,
  };
}

describe("maxIllustrationSlots", () => {
  it("caps kids books at one slot per four pages", () => {
    assert.equal(maxIllustrationSlots(10, "kids"), 3);
    assert.equal(maxIllustrationSlots(15, "kids"), 4);
  });

  it("caps teen and adult books at one slot per five pages", () => {
    assert.equal(maxIllustrationSlots(10, "teen"), 2);
    assert.equal(maxIllustrationSlots(10, "adult"), 2);
    assert.equal(maxIllustrationSlots(15, "adult"), 3);
  });
});

describe("normalizeStoryPlanSlots", () => {
  it("strips page 1 slots", () => {
    const normalized = normalizeStoryPlanSlots(makePlan());
    const pageOne = normalized.pages.find((page) => page.pageNumber === 1);
    assert.equal(pageOne?.slots.length, 0);
    assert.equal(pageOne?.layout, "title");
  });

  it("keeps at most one slot per page", () => {
    const plan = makePlan({
      pages: [
        {
          pageNumber: 1,
          layout: "title",
          summary: "Title",
          slots: [],
        },
        {
          pageNumber: 2,
          layout: "text_with_hero",
          summary: "Busy page",
          slots: [
            {
              slotId: "illus_p2_s1",
              type: "illustration",
              briefHint: "first",
            },
            {
              slotId: "illus_p2_s2",
              type: "illustration",
              briefHint: "second",
            },
          ],
        },
      ],
      pageCount: 2,
    });

    const normalized = normalizeStoryPlanSlots(plan);
    const pageTwo = normalized.pages.find((page) => page.pageNumber === 2);
    assert.equal(pageTwo?.slots.length, 1);
    assert.equal(pageTwo?.slots[0]?.slotId, "illus_p2_s1");
  });

  it("trims overflow slots to the audience cap", () => {
    const normalized = normalizeStoryPlanSlots(makePlan());
    const totalSlots = normalized.pages.reduce(
      (count, page) => count + page.slots.length,
      0,
    );
    assert.equal(totalSlots, 3);
  });

  it("prefers hero layout pages when trimming", () => {
    const plan = makePlan({
      pages: Array.from({ length: 10 }, (_, index) => ({
        pageNumber: index + 1,
        layout:
          index === 0
            ? "title"
            : index === 4
              ? "text_with_hero"
              : "text_with_inline",
        summary: `Page ${index + 1}`,
        slots:
          index === 0
            ? []
            : [
                {
                  slotId: `illus_p${index + 1}_s1`,
                  type: "illustration" as const,
                  briefHint: `scene ${index + 1}`,
                },
              ],
      })),
    });

    const normalized = normalizeStoryPlanSlots(plan);
    const heroPage = normalized.pages.find((page) => page.pageNumber === 5);
    assert.equal(heroPage?.slots.length, 1);
  });
});
