import type { CreationGenerationMetadata } from "@/types/content-metadata";

export type PipelineStep =
  | "reference_extract"
  | "web_research"
  | "story_plan"
  | "story_write"
  | "story_cover"
  | "story_illustrate"
  | "story_compose"
  | "audio_plan"
  | "audio_director"
  | "audio_cover"
  | "audio_tts"
  | "audio_compose";

export function initialStepForCategory(_category: string): PipelineStep {
  return "reference_extract";
}

export function isTerminalStep(step: PipelineStep): boolean {
  return step === "story_compose" || step === "audio_compose";
}

export interface StepResult {
  done: boolean;
  nextStep?: PipelineStep;
  progress: number;
  metadataPatch: CreationGenerationMetadata;
  title?: string;
  description?: string;
  pageCount?: number;
  durationMinutes?: number;
}
