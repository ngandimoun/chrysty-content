"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  filterSchema,
  type FilterFormValues,
} from "@/features/home/filter-schema";
import {
  FILTER_AUDIO_DURATION_OPTIONS,
  FILTER_AUDIOBOOK_SUBTYPE_OPTIONS,
  FILTER_CATEGORY_OPTIONS,
  FILTER_GENERATION_OPTIONS,
  FILTER_CONSUMPTION_STATUS_OPTIONS,
  FILTER_CREATED_OPTIONS,
  FILTER_PODCAST_SUBTYPE_OPTIONS,
  FILTER_SORT_OPTIONS,
  FILTER_STATUS_OPTIONS,
  FILTER_STORY_PAGES_OPTIONS,
  FILTER_STORY_SUBTYPE_OPTIONS,
} from "@/features/home/filter-options";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { DEFAULT_FILTER_STATE } from "@/types/filters";
import type { CreationCategory, CreationStatus } from "@/types/creation";
import { useHomeUiStore } from "@/stores/home-ui-store";

interface FilterFormProps {
  onApply?: () => void;
  onReset?: () => void;
}

function toggleArrayValue<T extends string>(current: T[], value: T): T[] {
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}

export function FilterForm({ onApply, onReset }: FilterFormProps) {
  const reducedMotion = useReducedMotion();
  const filters = useHomeUiStore((s) => s.filters);
  const setFilters = useHomeUiStore((s) => s.setFilters);
  const resetFilters = useHomeUiStore((s) => s.resetFilters);

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: filters,
  });

  useEffect(() => {
    form.reset(filters);
  }, [filters, form]);

  const handleApply = form.handleSubmit((values) => {
    setFilters(values);
    onApply?.();
  });

  const handleReset = () => {
    form.reset(DEFAULT_FILTER_STATE);
    resetFilters();
    onReset?.();
  };

  const watchedCategories =
    useWatch({ control: form.control, name: "categories" }) ?? [];
  const watchedStorySubtypes =
    useWatch({ control: form.control, name: "storySubtypes" }) ?? [];
  const watchedAudiobookSubtypes =
    useWatch({ control: form.control, name: "audiobookSubtypes" }) ?? [];
  const watchedPodcastSubtypes =
    useWatch({ control: form.control, name: "podcastSubtypes" }) ?? [];
  const watchedStatuses =
    useWatch({ control: form.control, name: "statuses" }) ?? [];
  const watchedGenerationFilters =
    useWatch({ control: form.control, name: "generationFilters" }) ?? [];
  const watchedConsumptionStatuses =
    useWatch({ control: form.control, name: "consumptionStatuses" }) ?? [];
  const watchedSort = useWatch({ control: form.control, name: "sort" });
  const watchedCreated = useWatch({ control: form.control, name: "created" });
  const watchedCreatedFrom = useWatch({
    control: form.control,
    name: "createdFrom",
  });
  const watchedCreatedTo = useWatch({
    control: form.control,
    name: "createdTo",
  });
  const watchedStoryPages = useWatch({
    control: form.control,
    name: "storyPages",
  });
  const watchedAudioDuration = useWatch({
    control: form.control,
    name: "audioDuration",
  });

  const storySelected = watchedCategories.includes("story");
  const audiobookSelected = watchedCategories.includes("audiobook");
  const podcastSelected = watchedCategories.includes("podcast");
  const audioSelected = audiobookSelected || podcastSelected;

  const toggleCategory = (category: CreationCategory) => {
    const next = toggleArrayValue(watchedCategories, category);
    form.setValue("categories", next);

    if (!next.includes("story")) {
      form.setValue("storySubtypes", []);
      form.setValue("storyPages", null);
    }
    if (!next.includes("audiobook")) {
      form.setValue("audiobookSubtypes", []);
    }
    if (!next.includes("podcast")) {
      form.setValue("podcastSubtypes", []);
    }
    if (!next.includes("audiobook") && !next.includes("podcast")) {
      form.setValue("audioDuration", null);
    }
  };

  const expandProps = reducedMotion
    ? {}
    : {
        initial: { height: 0, opacity: 0 },
        animate: { height: "auto", opacity: 1 },
        exit: { height: 0, opacity: 0 },
        transition: { duration: 0.2, ease: "easeOut" as const },
      };

  return (
    <form onSubmit={handleApply} className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-3 text-sm font-medium">Sort</legend>
        <RadioGroup
          value={watchedSort}
          onValueChange={(v) =>
            form.setValue("sort", v as FilterFormValues["sort"])
          }
          className="gap-2"
        >
          {FILTER_SORT_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <RadioGroupItem value={opt.value} id={`sort-${opt.value}`} />
              <Label htmlFor={`sort-${opt.value}`} className="font-normal">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <Separator />

      <fieldset>
        <legend className="mb-3 text-sm font-medium">Type</legend>
        <div className="flex flex-col gap-2">
          {FILTER_CATEGORY_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`category-${opt.value}`}
                checked={watchedCategories.includes(opt.value)}
                onCheckedChange={() => toggleCategory(opt.value)}
              />
              <Label htmlFor={`category-${opt.value}`} className="font-normal">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </fieldset>

      <Separator />

      <fieldset>
        <legend className="mb-3 text-sm font-medium">Status</legend>
        <div className="flex flex-wrap gap-3">
          {FILTER_STATUS_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`status-${opt.value}`}
                checked={watchedStatuses.includes(opt.value)}
                onCheckedChange={() =>
                  form.setValue(
                    "statuses",
                    toggleArrayValue(
                      watchedStatuses,
                      opt.value as CreationStatus,
                    ),
                  )
                }
              />
              <Label htmlFor={`status-${opt.value}`} className="font-normal">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </fieldset>

      <Separator />

      <fieldset>
        <legend className="mb-3 text-sm font-medium">Generation</legend>
        <div className="flex flex-wrap gap-3">
          {FILTER_GENERATION_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`generation-${opt.value}`}
                checked={watchedGenerationFilters.includes(opt.value)}
                onCheckedChange={() =>
                  form.setValue(
                    "generationFilters",
                    toggleArrayValue(watchedGenerationFilters, opt.value),
                  )
                }
              />
              <Label htmlFor={`generation-${opt.value}`} className="font-normal">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </fieldset>

      <Separator />

      <fieldset>
        <legend className="mb-3 text-sm font-medium">Reading & listening</legend>
        <div className="flex flex-wrap gap-3">
          {FILTER_CONSUMPTION_STATUS_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`consumption-${opt.value}`}
                checked={watchedConsumptionStatuses.includes(opt.value)}
                onCheckedChange={() =>
                  form.setValue(
                    "consumptionStatuses",
                    toggleArrayValue(
                      watchedConsumptionStatuses,
                      opt.value,
                    ),
                  )
                }
              />
              <Label
                htmlFor={`consumption-${opt.value}`}
                className="font-normal"
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </fieldset>

      <Separator />

      <fieldset>
        <legend className="mb-3 text-sm font-medium">Created</legend>
        <RadioGroup
          value={watchedCreated ?? "none"}
          onValueChange={(v) => {
            if (v === "none") {
              form.setValue("created", null);
              form.setValue("createdFrom", undefined);
              form.setValue("createdTo", undefined);
            } else {
              form.setValue(
                "created",
                v as FilterFormValues["created"] & string,
              );
              if (v !== "custom") {
                form.setValue("createdFrom", undefined);
                form.setValue("createdTo", undefined);
              }
            }
          }}
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="none" id="created-none" />
            <Label htmlFor="created-none" className="font-normal">
              Any time
            </Label>
          </div>
          {FILTER_CREATED_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <RadioGroupItem value={opt.value} id={`created-${opt.value}`} />
              <Label htmlFor={`created-${opt.value}`} className="font-normal">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {watchedCreated === "custom" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="created-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="created-from"
                type="date"
                value={watchedCreatedFrom ?? ""}
                onChange={(e) => form.setValue("createdFrom", e.target.value)}
                aria-invalid={!!form.formState.errors.createdFrom}
              />
              {form.formState.errors.createdFrom && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.createdFrom.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="created-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="created-to"
                type="date"
                value={watchedCreatedTo ?? ""}
                onChange={(e) => form.setValue("createdTo", e.target.value)}
                aria-invalid={!!form.formState.errors.createdTo}
              />
              {form.formState.errors.createdTo && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.createdTo.message}
                </p>
              )}
            </div>
          </div>
        )}
      </fieldset>

      <AnimatePresence initial={false}>
        {storySelected && (
          <motion.div key="story-filters" className="overflow-hidden" {...expandProps}>
            <Separator className="mb-5" />
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Story Type</legend>
              <div className="grid grid-cols-2 gap-2">
                {FILTER_STORY_SUBTYPE_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`story-subtype-${opt.value}`}
                      checked={watchedStorySubtypes.includes(opt.value)}
                      onCheckedChange={() =>
                        form.setValue(
                          "storySubtypes",
                          toggleArrayValue(watchedStorySubtypes, opt.value),
                        )
                      }
                    />
                    <Label
                      htmlFor={`story-subtype-${opt.value}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>

            <Separator className="my-5" />

            <fieldset>
              <legend className="mb-3 text-sm font-medium">Pages</legend>
              <RadioGroup
                value={watchedStoryPages ?? "any"}
                onValueChange={(v) =>
                  form.setValue(
                    "storyPages",
                    v === "any"
                      ? null
                      : (v as FilterFormValues["storyPages"] & string),
                  )
                }
                className="gap-2"
              >
                {FILTER_STORY_PAGES_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={opt.value}
                      id={`story-pages-${opt.value}`}
                    />
                    <Label
                      htmlFor={`story-pages-${opt.value}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {audiobookSelected && (
          <motion.div
            key="audiobook-filters"
            className="overflow-hidden"
            {...expandProps}
          >
            <Separator className="mb-5" />
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Audiobook Type</legend>
              <div className="grid grid-cols-2 gap-2">
                {FILTER_AUDIOBOOK_SUBTYPE_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`audiobook-subtype-${opt.value}`}
                      checked={watchedAudiobookSubtypes.includes(opt.value)}
                      onCheckedChange={() =>
                        form.setValue(
                          "audiobookSubtypes",
                          toggleArrayValue(watchedAudiobookSubtypes, opt.value),
                        )
                      }
                    />
                    <Label
                      htmlFor={`audiobook-subtype-${opt.value}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {podcastSelected && (
          <motion.div
            key="podcast-filters"
            className="overflow-hidden"
            {...expandProps}
          >
            <Separator className="mb-5" />
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Podcast Type</legend>
              <div className="grid grid-cols-2 gap-2">
                {FILTER_PODCAST_SUBTYPE_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`podcast-subtype-${opt.value}`}
                      checked={watchedPodcastSubtypes.includes(opt.value)}
                      onCheckedChange={() =>
                        form.setValue(
                          "podcastSubtypes",
                          toggleArrayValue(watchedPodcastSubtypes, opt.value),
                        )
                      }
                    />
                    <Label
                      htmlFor={`podcast-subtype-${opt.value}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {audioSelected && (
          <motion.div
            key="audio-duration"
            className="overflow-hidden"
            {...expandProps}
          >
            <Separator className="mb-5" />
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Duration</legend>
              <RadioGroup
                value={watchedAudioDuration ?? "any"}
                onValueChange={(v) =>
                  form.setValue(
                    "audioDuration",
                    v === "any"
                      ? null
                      : (v as FilterFormValues["audioDuration"] & string),
                  )
                }
                className="gap-2"
              >
                {FILTER_AUDIO_DURATION_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={opt.value}
                      id={`audio-duration-${opt.value}`}
                    />
                    <Label
                      htmlFor={`audio-duration-${opt.value}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button type="submit" className="flex-1">
          Apply
        </Button>
      </div>
    </form>
  );
}
