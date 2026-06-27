"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CustomRadioField,
  FieldError,
  FormFieldset,
  FormSection,
  RadioFieldset,
  TextAreaField,
} from "@/components/creation/form-primitives";
import { LanguageSelectField } from "@/components/creation/language-select-field";
import { ReferenceFilesField } from "@/components/creation/reference-files-field";
import {
  STORY_AUDIENCE_OPTIONS,
  STORY_LENGTH_OPTIONS,
  STORY_TYPE_OPTIONS,
  CUSTOM_VALUE,
} from "@/features/creation/creation-options";
import {
  STORY_DEFAULT_VALUES,
  storyCreationSchema,
  type StoryCreationFormValues,
} from "@/features/creation/creation-schema";
import type { StoryCreationInput } from "@/features/creation/types";

interface StoryCreationFormProps {
  onSubmit: (input: StoryCreationInput, files?: File[]) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function StoryCreationForm({ onSubmit, onBack, isSubmitting }: StoryCreationFormProps) {
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const form = useForm<StoryCreationFormValues>({
    resolver: zodResolver(storyCreationSchema),
    defaultValues: STORY_DEFAULT_VALUES,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;

  const storyType = watch("storyType");
  const storyTypeCustom = watch("storyTypeCustom");
  const language = watch("language");
  const mainIdea = watch("mainIdea");
  const audience = watch("audience");
  const length = watch("length");
  const lengthCustom = watch("lengthCustom");

  const submit = handleSubmit((values) => {
    onSubmit(values, referenceFiles.length > 0 ? referenceFiles : undefined);
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <FormSection>
        <LanguageSelectField
          value={language}
          error={errors.language?.message}
          onChange={(v) => setValue("language", v, { shouldValidate: true })}
        />
      </FormSection>

      <FormSection>
        <CustomRadioField<StoryCreationFormValues>
          legend="Story Type"
          fieldName="storyType"
          customFieldName="storyTypeCustom"
          options={STORY_TYPE_OPTIONS}
          value={storyType}
          customValue={storyTypeCustom}
          errors={errors}
          onValueChange={(v) => setValue("storyType", v, { shouldValidate: true })}
          onCustomChange={(v) =>
            setValue("storyTypeCustom", v, { shouldValidate: true })
          }
          idPrefix="story-type"
        />
      </FormSection>

      <FormSection>
        <TextAreaField<StoryCreationFormValues>
          legend="Main Idea"
          name="mainIdea"
          value={mainIdea}
          error={errors.mainIdea?.message}
          placeholder="Describe the story you want to create..."
          onChange={(v) => setValue("mainIdea", v, { shouldValidate: true })}
        />
      </FormSection>

      <FormSection>
        <ReferenceFilesField files={referenceFiles} onChange={setReferenceFiles} />
      </FormSection>

      <FormSection>
        <RadioFieldset
          legend="Audience"
          options={STORY_AUDIENCE_OPTIONS}
          value={audience}
          error={errors.audience?.message}
          onValueChange={(v) =>
            setValue("audience", v as StoryCreationFormValues["audience"], {
              shouldValidate: true,
            })
          }
          idPrefix="story-audience"
        />
      </FormSection>

      <FormSection showSeparator={false}>
        <FormFieldset legend="Length (max 15 pages)">
          <RadioGroup
            value={length}
            onValueChange={(v) =>
              setValue("length", v as StoryCreationFormValues["length"], {
                shouldValidate: true,
              })
            }
            className="gap-2"
          >
            {STORY_LENGTH_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={opt.value}
                  id={`story-length-${opt.value}`}
                />
                <Label
                  htmlFor={`story-length-${opt.value}`}
                  className="font-normal"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {length === CUSTOM_VALUE && (
            <Input
              type="number"
              min={1}
              max={15}
              value={lengthCustom ?? ""}
              onChange={(e) =>
                setValue(
                  "lengthCustom",
                  e.target.value === "" ? undefined : Number(e.target.value),
                  { shouldValidate: true },
                )
              }
              placeholder="Enter page count (1–15)"
              aria-invalid={!!errors.lengthCustom}
              className="mt-2"
            />
          )}
          <FieldError
            message={errors.length?.message ?? errors.lengthCustom?.message}
          />
        </FormFieldset>
      </FormSection>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create"}
        </Button>
      </div>
    </form>
  );
}
