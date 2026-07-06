"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  CustomRadioField,
  FormSection,
  TextAreaField,
} from "@/components/creation/form-primitives";
import { LanguageSelectField } from "@/components/creation/language-select-field";
import { ReferenceFilesField } from "@/components/creation/reference-files-field";
import {
  AUDIOBOOK_TYPE_OPTIONS,
  VOICE_STYLE_OPTIONS,
} from "@/features/creation/creation-options";
import {
  AUDIOBOOK_DEFAULT_VALUES,
  audiobookCreationSchema,
  type AudiobookCreationFormValues,
} from "@/features/creation/creation-schema";
import type { AudiobookCreationInput } from "@/features/creation/types";

interface AudiobookCreationFormProps {
  onSubmit: (input: AudiobookCreationInput, files?: File[]) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function AudiobookCreationForm({
  onSubmit,
  onBack,
  isSubmitting,
}: AudiobookCreationFormProps) {
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const form = useForm<AudiobookCreationFormValues>({
    resolver: zodResolver(audiobookCreationSchema),
    defaultValues: AUDIOBOOK_DEFAULT_VALUES,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;

  const audiobookType = watch("audiobookType");
  const audiobookTypeCustom = watch("audiobookTypeCustom");
  const language = watch("language");
  const topicIdea = watch("topicIdea");
  const voiceStyle = watch("voiceStyle");
  const voiceStyleCustom = watch("voiceStyleCustom");

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
        <CustomRadioField<AudiobookCreationFormValues>
          legend="Audiobook Type"
          fieldName="audiobookType"
          customFieldName="audiobookTypeCustom"
          options={AUDIOBOOK_TYPE_OPTIONS}
          value={audiobookType}
          customValue={audiobookTypeCustom}
          errors={errors}
          onValueChange={(v) =>
            setValue("audiobookType", v, { shouldValidate: true })
          }
          onCustomChange={(v) =>
            setValue("audiobookTypeCustom", v, { shouldValidate: true })
          }
          idPrefix="audiobook-type"
        />
      </FormSection>

      <FormSection>
        <TextAreaField<AudiobookCreationFormValues>
          legend="Topic / Idea"
          name="topicIdea"
          value={topicIdea}
          error={errors.topicIdea?.message}
          placeholder="What should this audiobook be about?"
          onChange={(v) => setValue("topicIdea", v, { shouldValidate: true })}
          voiceInput
          disabled={isSubmitting}
        />
      </FormSection>

      <FormSection>
        <ReferenceFilesField files={referenceFiles} onChange={setReferenceFiles} />
      </FormSection>

      <FormSection showSeparator={false}>
        <CustomRadioField<AudiobookCreationFormValues>
          legend="Voice Style"
          fieldName="voiceStyle"
          customFieldName="voiceStyleCustom"
          options={VOICE_STYLE_OPTIONS}
          value={voiceStyle}
          customValue={voiceStyleCustom}
          errors={errors}
          onValueChange={(v) =>
            setValue("voiceStyle", v, { shouldValidate: true })
          }
          onCustomChange={(v) =>
            setValue("voiceStyleCustom", v, { shouldValidate: true })
          }
          customPlaceholder="Describe your custom voice style"
          idPrefix="voice-style"
        />
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
