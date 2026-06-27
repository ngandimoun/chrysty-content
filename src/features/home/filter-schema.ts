import { z } from "zod";

export const filterSchema = z
  .object({
    sort: z.enum([
      "recently_created",
      "last_opened",
      "recently_updated",
      "alphabetical",
      "favorites",
    ]),
    categories: z.array(z.enum(["story", "audiobook", "podcast"])),
    storySubtypes: z.array(z.string()),
    audiobookSubtypes: z.array(z.string()),
    podcastSubtypes: z.array(z.string()),
    statuses: z.array(
      z.enum(["completed", "draft", "generating", "failed", "archived"]),
    ),
    consumptionStatuses: z.array(
      z.enum(["not_started", "in_progress", "completed", "abandoned"]),
    ),
    generationFilters: z.array(z.enum(["ready"])),
    created: z
      .enum(["today", "this_week", "this_month", "custom"])
      .nullable(),
    createdFrom: z.string().optional(),
    createdTo: z.string().optional(),
    storyPages: z.enum(["5", "10", "15", "any"]).nullable(),
    audioDuration: z.enum(["under_5", "5_to_15", "over_15", "any"]).nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.created === "custom") {
      if (!data.createdFrom) {
        ctx.addIssue({
          code: "custom",
          message: "Select a start date",
          path: ["createdFrom"],
        });
      }
      if (!data.createdTo) {
        ctx.addIssue({
          code: "custom",
          message: "Select an end date",
          path: ["createdTo"],
        });
      }
      if (
        data.createdFrom &&
        data.createdTo &&
        data.createdFrom > data.createdTo
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Start date must be before end date",
          path: ["createdTo"],
        });
      }
    }
  });

export type FilterFormValues = z.infer<typeof filterSchema>;
