import { initialStepForCategory } from "@/lib/ai/orchestrator/types";
import { asMetadata } from "@/lib/ai/orchestrator/metadata";
import { runAudioStep } from "@/lib/ai/pipelines/audio";
import { runStoryStep } from "@/lib/ai/pipelines/story";
import type { CreationRecord } from "@/lib/content/creations";
import type { CreationGenerationMetadata } from "@/types/content-metadata";

const STEP_LOCK_MS = 10_000;

export interface RunStepResult {
  done: boolean;
  progress: number;
  status: "generating" | "completed" | "failed";
  metadata: CreationGenerationMetadata;
  title?: string;
  description?: string;
  pageCount?: number;
  durationMinutes?: number;
  skipped?: boolean;
}

export async function runNextStep(creation: CreationRecord): Promise<RunStepResult> {
  const metadata = asMetadata(creation.metadata);

  if (creation.status === "completed") {
    return {
      done: true,
      progress: creation.generationProgress ?? 100,
      status: "completed",
      metadata,
    };
  }

  if (creation.status === "failed") {
    return {
      done: true,
      progress: creation.generationProgress ?? 0,
      status: "failed",
      metadata,
    };
  }

  const stepStartedAt = metadata.pipeline.stepStartedAt;
  if (
    stepStartedAt &&
    Date.now() - new Date(stepStartedAt).getTime() < STEP_LOCK_MS
  ) {
    return {
      done: false,
      progress: creation.generationProgress ?? 0,
      status: "generating",
      metadata,
      skipped: true,
    };
  }

  const stepRunner =
    creation.category === "story" ? runStoryStep : runAudioStep;

  const lockedMetadata = asMetadata({
    ...metadata,
    pipeline: {
      ...metadata.pipeline,
      step: metadata.pipeline.step ?? initialStepForCategory(creation.category),
      stepStartedAt: new Date().toISOString(),
    },
  });

  try {
    const result = await stepRunner({
      ...creation,
      metadata: lockedMetadata,
    });

    const nextMetadata = asMetadata({
      ...result.metadataPatch,
      pipeline: {
        ...result.metadataPatch.pipeline,
        step: result.done
          ? result.metadataPatch.pipeline.step
          : (result.nextStep ?? result.metadataPatch.pipeline.step),
        stepStartedAt: undefined,
      },
    });

    return {
      done: result.done,
      progress: result.progress,
      status: result.done ? "completed" : "generating",
      metadata: nextMetadata,
      title: result.title,
      description: result.description,
      pageCount: result.pageCount,
      durationMinutes: result.durationMinutes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    const failedMetadata = asMetadata({
      ...metadata,
      pipeline: {
        ...metadata.pipeline,
        status: "failed",
        error: message,
        stepStartedAt: undefined,
      },
    });

    return {
      done: true,
      progress: creation.generationProgress ?? 0,
      status: "failed",
      metadata: failedMetadata,
    };
  }
}
