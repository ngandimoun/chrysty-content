"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  CustomRadioField,
  FormSection,
  RadioFieldset,
  TextAreaField,
} from "@/components/creation/form-primitives";
import { LanguageSelectField } from "@/components/creation/language-select-field";
import { ReferenceFilesField } from "@/components/creation/reference-files-field";
import {
  EDUCATIONAL_SUBJECT_OPTIONS,
  INTERVIEW_PARTICIPANT_OPTIONS,
  NEWS_TYPE_OPTIONS,
  PODCAST_TYPE_OPTIONS,
} from "@/features/creation/creation-options";
import {
  PODCAST_DEFAULT_VALUES,
  podcastCreationSchema,
  type PodcastCreationFormValues,
} from "@/features/creation/creation-schema";
import type { PodcastCreationInput } from "@/features/creation/types";

interface PodcastCreationFormProps {
  onSubmit: (input: PodcastCreationInput, files?: File[]) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function PodcastCreationForm({
  onSubmit,
  onBack,
  isSubmitting,
}: PodcastCreationFormProps) {
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const form = useForm<PodcastCreationFormValues>({
    resolver: zodResolver(podcastCreationSchema),
    defaultValues: PODCAST_DEFAULT_VALUES,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;

  const podcastType = watch("podcastType");
  const podcastTypeCustom = watch("podcastTypeCustom");
  const language = watch("language");
  const newsType = watch("newsType") ?? "";
  const subject = watch("subject") ?? "";
  const subjectCustom = watch("subjectCustom");
  const participants = watch("participants") ?? "";
  const topicIdea = watch("topicIdea");

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
        <CustomRadioField<PodcastCreationFormValues>
          legend="Podcast Type"
          fieldName="podcastType"
          customFieldName="podcastTypeCustom"
          options={PODCAST_TYPE_OPTIONS}
          value={podcastType}
          customValue={podcastTypeCustom}
          errors={errors}
          onValueChange={(v) => {
            setValue("podcastType", v, { shouldValidate: true });
            if (v !== "news") setValue("newsType", "");
            if (v !== "educational") {
              setValue("subject", "");
              setValue("subjectCustom", "");
            }
            if (v !== "interview") setValue("participants", "");
          }}
          onCustomChange={(v) =>
            setValue("podcastTypeCustom", v, { shouldValidate: true })
          }
          idPrefix="podcast-type"
        />
      </FormSection>

      {podcastType === "news" && (
        <FormSection>
          <RadioFieldset
            legend="News Type"
            options={NEWS_TYPE_OPTIONS}
            value={newsType}
            error={errors.newsType?.message}
            onValueChange={(v) =>
              setValue("newsType", v, { shouldValidate: true })
            }
            idPrefix="news-type"
          />
        </FormSection>
      )}

      {podcastType === "educational" && (
        <FormSection>
          <CustomRadioField<PodcastCreationFormValues>
            legend="Subject"
            fieldName="subject"
            customFieldName="subjectCustom"
            options={EDUCATIONAL_SUBJECT_OPTIONS}
            value={subject}
            customValue={subjectCustom}
            errors={errors}
            onValueChange={(v) =>
              setValue("subject", v, { shouldValidate: true })
            }
            onCustomChange={(v) =>
              setValue("subjectCustom", v, { shouldValidate: true })
            }
            customPlaceholder="Describe your custom subject"
            idPrefix="podcast-subject"
          />
        </FormSection>
      )}

      {podcastType === "interview" && (
        <FormSection>
          <RadioFieldset
            legend="Participants"
            options={INTERVIEW_PARTICIPANT_OPTIONS}
            value={participants}
            error={errors.participants?.message}
            onValueChange={(v) =>
              setValue("participants", v, { shouldValidate: true })
            }
            idPrefix="participants"
          />
        </FormSection>
      )}

      {podcastType && (
        <FormSection>
          <TextAreaField<PodcastCreationFormValues>
            legend="Topic / Idea"
            name="topicIdea"
            value={topicIdea}
            error={errors.topicIdea?.message}
            placeholder="What should this episode be about?"
            onChange={(v) => setValue("topicIdea", v, { shouldValidate: true })}
            voiceInput
            disabled={isSubmitting}
          />
        </FormSection>
      )}

      {podcastType && (
        <FormSection showSeparator={false}>
          <ReferenceFilesField files={referenceFiles} onChange={setReferenceFiles} />
        </FormSection>
      )}

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
