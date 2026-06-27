"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AudiobookCreationForm } from "@/components/creation/audiobook-creation-form";
import { CategorySelectionStep } from "@/components/creation/category-selection-step";
import { WizardStepHeader } from "@/components/creation/form-primitives";
import { PodcastCreationForm } from "@/components/creation/podcast-creation-form";
import { StoryCreationForm } from "@/components/creation/story-creation-form";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCategoryMeta } from "@/features/creation/creation-options";
import type {
  CreationCategory,
  CreationInput,
  WizardStep,
} from "@/features/creation/types";
import { createCreationViaApi, triggerGenerationViaApi } from "@/lib/content/api-client";
import { useHomeUiStore } from "@/stores/home-ui-store";

export function CreationWizardModal() {
  const queryClient = useQueryClient();
  const isOpen = useHomeUiStore((s) => s.isCreationModalOpen);
  const setOpen = useHomeUiStore((s) => s.setCreationModalOpen);

  const [step, setStep] = useState<WizardStep>("category");
  const [category, setCategory] = useState<CreationCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetWizard = useCallback(() => {
    setStep("category");
    setCategory(null);
  }, []);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      resetWizard();
    }
  };

  const handleCategorySelect = (selected: CreationCategory) => {
    setCategory(selected);
    setStep("form");
  };

  const handleBack = () => {
    setStep("category");
    setCategory(null);
  };

  const handleSubmit = async (input: CreationInput, files?: File[]) => {
    setIsSubmitting(true);
    try {
      const creation = await createCreationViaApi(input, files);
      void triggerGenerationViaApi(creation.id).catch(() => {
        /* server waitUntil is primary; client kickoff is backup */
      });
      await queryClient.invalidateQueries({ queryKey: ["creations"] });
      await queryClient.invalidateQueries({ queryKey: ["recent-activity"] });

      toast.success("Creation started", {
        description: `Your ${getCategoryMeta(input.category).title.toLowerCase()} is being generated.`,
      });
      setOpen(false);
      resetWizard();
    } catch (error) {
      toast.error("Could not save creation", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryMeta = category ? getCategoryMeta(category) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden">
        <DialogHeader>
          {step === "category" && (
            <DialogTitle>What would you like to create today?</DialogTitle>
          )}
        </DialogHeader>

        <DialogBody className="pb-6">
          {step === "category" && (
            <CategorySelectionStep onSelect={handleCategorySelect} />
          )}

          {step === "form" && categoryMeta && (
            <>
              <WizardStepHeader
                emoji={categoryMeta.emoji}
                title={categoryMeta.title}
                onBack={handleBack}
              />

              {category === "story" && (
                <StoryCreationForm
                  onSubmit={handleSubmit}
                  onBack={handleBack}
                  isSubmitting={isSubmitting}
                />
              )}
              {category === "audiobook" && (
                <AudiobookCreationForm
                  onSubmit={handleSubmit}
                  onBack={handleBack}
                  isSubmitting={isSubmitting}
                />
              )}
              {category === "podcast" && (
                <PodcastCreationForm
                  onSubmit={handleSubmit}
                  onBack={handleBack}
                  isSubmitting={isSubmitting}
                />
              )}
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
