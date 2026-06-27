import { extractReferenceContext } from "@/lib/ai/documents/extract-reference-context";
import { fetchPodcastWebResearch } from "@/lib/ai/research/web-search-context";
import {
  concatenateWavBuffers,
  measurePlayableWavSeconds,
  repairWavBuffer,
} from "@/lib/ai/audio/concat";
import {
  normalizeAudioPlan,
  sanitizeAudiobookTranscript,
} from "@/lib/ai/audio/normalize-plan";
import {
  resolveTtsSegments,
  transcriptForSegment,
} from "@/lib/ai/audio/tts-segments";
import { synthesizeSpeech } from "@/lib/ai/audio/tts";
import { generateCoverImage } from "@/lib/ai/image/generate";
import {
  audiobookCoverPrompt,
  audiobookDirectorUserMessage,
  audiobookPlanSystemInstruction,
  audiobookPlanUserMessage,
} from "@/lib/ai/prompts/audiobook";
import {
  podcastCoverPrompt,
  podcastDirectorUserMessage,
  podcastPlanSystemInstruction,
  podcastPlanUserMessage,
} from "@/lib/ai/prompts/podcast";
import { generateVisualThemeFromContent, normalizeVisualTheme } from "@/lib/ai/mood/generate-visual-theme";
import { mergeMetadata, asMetadata } from "@/lib/ai/orchestrator/metadata";
import type { StepResult } from "@/lib/ai/orchestrator/types";
import { createTextInteraction } from "@/lib/ai/text/interactions";
import { parseModelJson } from "@/lib/ai/text/json";
import {
  uploadCreationAssetBuffer,
} from "@/lib/content/assets";
import type { CreationRecord } from "@/lib/content/creations";
import {
  audioDirectionSchema,
  audioManifestSchema,
  audioPlanSchema,
  type AudioDirection,
  type AudioPlan,
  type CreationGenerationMetadata,
  type PipelineCheckpoint,
} from "@/types/content-metadata";

function getStep(metadata: CreationGenerationMetadata): string {
  const step = metadata.pipeline.step ?? "reference_extract";
  if (step === "audio_script") return "audio_director";
  return step;
}

function getCheckpoint(metadata: CreationGenerationMetadata): PipelineCheckpoint {
  return metadata.checkpoint ?? {};
}

function isAudiobook(creation: CreationRecord): boolean {
  return creation.category === "audiobook";
}

function nextStepAfterReferenceExtract(audiobook: boolean): "audio_plan" | "web_research" {
  return audiobook ? "audio_plan" : "web_research";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function audioContentExcerpt(
  audioPlan: AudioPlan,
  setup: Record<string, unknown>,
): string {
  const topic = String(setup.topicIdea ?? setup.topic ?? "");
  const summary = audioPlan.segments?.[0]?.summary;
  return [audioPlan.title, summary, topic].filter(Boolean).join(" — ").slice(0, 120);
}

function visualThemeExcerpt(
  audioPlan: AudioPlan,
  setup: Record<string, unknown>,
): string {
  const topic = String(setup.topicIdea ?? setup.topic ?? "");
  const summaries =
    audioPlan.segments?.map((s) => s.summary).filter(Boolean).join("; ") ?? "";
  return [audioPlan.title, topic, summaries].filter(Boolean).join(". ").slice(0, 400);
}

export async function runAudioStep(
  creation: CreationRecord,
): Promise<StepResult> {
  const metadata = asMetadata(creation.metadata);
  const step = getStep(metadata);
  const checkpoint = getCheckpoint(metadata);
  const setup = creation.setup;
  const audiobook = isAudiobook(creation);
  const referenceContext = checkpoint.referenceContext;
  let webResearchContext = checkpoint.webResearchContext;
  const webResearchAsOf = checkpoint.webResearchAsOf;

  if (step === "reference_extract") {
    const assetIds = (setup.referenceFileAssetIds as string[] | undefined) ?? [];
    const nextStep = nextStepAfterReferenceExtract(audiobook);

    if (assetIds.length === 0) {
      return {
        done: false,
        nextStep,
        progress: 5,
        metadataPatch: mergeMetadata(metadata, {
          pipeline: { status: "planning", step: nextStep },
        }),
      };
    }

    const extracted = await extractReferenceContext({
      contentKey: creation.contentKey,
      creationId: creation.id,
      setup,
      assetIds,
    });

    return {
      done: false,
      nextStep,
      progress: 8,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: { status: "planning", step: nextStep },
        checkpoint: { referenceContext: extracted },
      }),
    };
  }

  if (step === "web_research") {
    if (audiobook) {
      return {
        done: false,
        nextStep: "audio_plan",
        progress: 5,
        metadataPatch: mergeMetadata(metadata, {
          pipeline: { status: "planning", step: "audio_plan" },
        }),
      };
    }

    const research = await fetchPodcastWebResearch({ setup });
    const today = todayIso();

    return {
      done: false,
      nextStep: "audio_plan",
      progress: 12,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: { status: "planning", step: "audio_plan" },
        checkpoint: {
          webResearchContext: research.context,
          webResearchCitations: research.citations,
          webResearchAsOf: today,
        },
      }),
    };
  }

  if (step === "audio_plan") {
    let activeWebResearchContext = webResearchContext;
    let activeWebResearchAsOf = webResearchAsOf;
    let researchCheckpointPatch: Partial<PipelineCheckpoint> = {};

    if (!audiobook) {
      const today = todayIso();
      if (!activeWebResearchContext || activeWebResearchAsOf !== today) {
        const research = await fetchPodcastWebResearch({ setup });
        activeWebResearchContext = research.context;
        activeWebResearchAsOf = today;
        researchCheckpointPatch = {
          webResearchContext: research.context,
          webResearchCitations: research.citations,
          webResearchAsOf: today,
        };
      }
    }

    const result = await createTextInteraction({
      systemInstruction: audiobook
        ? audiobookPlanSystemInstruction()
        : podcastPlanSystemInstruction(),
      userMessage: audiobook
        ? audiobookPlanUserMessage(setup, referenceContext)
        : podcastPlanUserMessage(
            setup,
            referenceContext,
            activeWebResearchContext,
            activeWebResearchAsOf,
          ),
    });

    const audioPlan = normalizeAudioPlan(
      parseModelJson(result.text, audioPlanSchema),
      { creationId: creation.id },
    );

    return {
      done: false,
      nextStep: "audio_director",
      progress: audiobook ? 15 : 20,
      title: audioPlan.title,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: {
          status: "writing",
          step: "audio_director",
          textInteractionId: result.interactionId,
        },
        checkpoint: { audioPlan, ...researchCheckpointPatch },
      }),
    };
  }

  if (step === "audio_director") {
    const audioPlan = checkpoint.audioPlan;
    if (!audioPlan) {
      throw new Error("Missing audio plan for director step");
    }

    const result = await createTextInteraction({
      userMessage: audiobook
        ? audiobookDirectorUserMessage({
            setup,
            audioPlanJson: JSON.stringify(audioPlan),
            referenceContext,
          })
        : podcastDirectorUserMessage({
            setup,
            audioPlanJson: JSON.stringify(audioPlan),
            referenceContext,
            webResearchContext,
            webResearchAsOf,
          }),
      previousInteractionId: metadata.pipeline.textInteractionId,
    });

    const rawDirection = parseModelJson(result.text, audioDirectionSchema);
    const audioDirection = audiobook
      ? {
          ...rawDirection,
          transcript: sanitizeAudiobookTranscript(rawDirection.transcript),
        }
      : rawDirection;

    return {
      done: false,
      nextStep: "audio_cover",
      progress: 35,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: {
          status: "writing",
          step: "audio_cover",
          textInteractionId: result.interactionId,
        },
        audioDirection,
        checkpoint: { audioDirection },
        audio: {
          format: audioPlan.format,
          targetDurationMinutes: audioPlan.targetDurationMinutes,
        },
      }),
    };
  }

  if (step === "audio_cover") {
    const audioPlan = checkpoint.audioPlan;
    if (!audioPlan) throw new Error("Missing audio plan for cover");

    const prompt = audiobook
      ? audiobookCoverPrompt({ setup, title: audioPlan.title, referenceContext })
      : podcastCoverPrompt({
          setup,
          title: audioPlan.title,
          referenceContext,
          webResearchContext,
          webResearchAsOf,
        });

    const coverCheckpoint: Partial<PipelineCheckpoint> = {};

    try {
      const image = await generateCoverImage({
        prompt,
        creationId: creation.id,
      });
      const asset = await uploadCreationAssetBuffer({
        contentKey: creation.contentKey,
        creationId: creation.id,
        buffer: image.buffer,
        fileName: "cover.png",
        mimeType: image.mimeType,
        assetType: "cover",
        metadata: {
          role: "card_cover",
          altText: `Cover for ${audioPlan.title}`,
          prompt,
          status: "ready",
        },
      });

      coverCheckpoint.coverAssetId = asset.id;
      coverCheckpoint.coverStoragePath = asset.storage_path;
    } catch (error) {
      console.warn("[audio-cover] cover generation failed, continuing without cover", {
        creationId: creation.id,
        error: error instanceof Error ? error.message : String(error),
      });
      coverCheckpoint.coverGenerationSkipped = true;
      coverCheckpoint.coverGenerationError =
        error instanceof Error ? error.message : String(error);
    }

    return {
      done: false,
      nextStep: "audio_tts",
      progress: 45,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: {
          status: "composing",
          step: "audio_tts",
          ttsSegmentIndex: 0,
        },
        display: coverCheckpoint.coverAssetId
          ? { coverAssetId: coverCheckpoint.coverAssetId }
          : {},
        checkpoint: coverCheckpoint,
      }),
    };
  }

  if (step === "audio_tts") {
    const audioDirection = checkpoint.audioDirection ?? metadata.audioDirection;
    const audioPlan = checkpoint.audioPlan;
    if (!audioDirection || !audioPlan) {
      throw new Error("Missing audio direction for TTS");
    }

    const segments = resolveTtsSegments(audioPlan, audioDirection);

    const segmentIndex = metadata.pipeline.ttsSegmentIndex ?? 0;
    const segmentAssets = [...(checkpoint.segmentAssets ?? [])];

    if (segmentIndex >= segments.length) {
      return {
        done: false,
        nextStep: "audio_compose",
        progress: 90,
        metadataPatch: mergeMetadata(metadata, {
          pipeline: { step: "audio_compose", status: "composing" },
        }),
      };
    }

    const segment = segments[segmentIndex]!;
    const segmentTranscript = transcriptForSegment(
      audioDirection,
      segment,
      checkpoint.segmentTranscripts,
    );

    const directionForSegment: AudioDirection = {
      ...audioDirection,
      mode:
        segment.speakerNames.length > 1 ? "multi_speaker" : "single_speaker",
      speakers: audioDirection.speakers.filter((s) =>
        segment.speakerNames.includes(s.name),
      ),
    };

    const tts = await synthesizeSpeech({
      direction: directionForSegment,
      segmentTranscript,
      segmentId: segment.segmentId,
      creationId: creation.id,
    });

    const segmentDuration = measurePlayableWavSeconds(
      tts.wavBuffer,
      segment.segmentId,
    );

    const asset = await uploadCreationAssetBuffer({
      contentKey: creation.contentKey,
      creationId: creation.id,
      buffer: repairWavBuffer(tts.wavBuffer, segment.segmentId),
      fileName: `${segment.segmentId}.wav`,
      mimeType: "audio/wav",
      assetType: "audio",
      metadata: {
        role: "audio",
        segmentId: segment.segmentId,
        sequence: segmentIndex,
        altText: `Audio segment ${segmentIndex + 1} for ${audioPlan.title}`,
        durationSeconds: segmentDuration,
        model: tts.ttsModel,
        status: "ready",
      },
    });

    segmentAssets.push({
      segmentId: segment.segmentId,
      assetId: asset.id,
      storagePath: asset.storage_path,
      durationSeconds: segmentDuration,
    });

    const nextIndex = segmentIndex + 1;
    const ttsProgress =
      45 + Math.floor((nextIndex / segments.length) * 45);

    return {
      done: false,
      nextStep: nextIndex >= segments.length ? "audio_compose" : "audio_tts",
      progress: nextIndex >= segments.length ? 90 : ttsProgress,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: {
          status: "composing",
          step: nextIndex >= segments.length ? "audio_compose" : "audio_tts",
          ttsSegmentIndex: nextIndex,
          ttsInteractionId: tts.interactionId,
          ttsModel: tts.ttsModel,
        },
        checkpoint: { segmentAssets },
      }),
    };
  }

  if (step === "audio_compose") {
    const audioPlan = checkpoint.audioPlan;
    const audioDirection = checkpoint.audioDirection ?? metadata.audioDirection;
    const coverAssetId = checkpoint.coverAssetId;
    const segmentAssets = checkpoint.segmentAssets ?? [];

    if (!audioPlan || !audioDirection) {
      throw new Error("Missing checkpoints for audio compose");
    }

    const { downloadAssetBuffer } = await import("@/lib/content/assets");
    const wavBuffers: Buffer[] = [];
    for (const seg of segmentAssets) {
      const raw = await downloadAssetBuffer(seg.storagePath);
      wavBuffers.push(repairWavBuffer(raw, seg.segmentId));
    }

    let finalAudioAssetId: string | undefined;
    let totalSeconds = 0;

    if (wavBuffers.length > 0) {
      const masterWav =
        wavBuffers.length === 1
          ? wavBuffers[0]!
          : concatenateWavBuffers(wavBuffers);
      totalSeconds = measurePlayableWavSeconds(masterWav, creation.id);

      const plannedSeconds = audioPlan.targetDurationMinutes * 60;
      if (
        plannedSeconds > 0 &&
        (totalSeconds > plannedSeconds * 3 || totalSeconds < plannedSeconds / 3)
      ) {
        console.warn("[audio-compose] measured duration diverges from plan", {
          creationId: creation.id,
          plannedMinutes: audioPlan.targetDurationMinutes,
          measuredMinutes: totalSeconds / 60,
        });
      }

      const masterAsset = await uploadCreationAssetBuffer({
        contentKey: creation.contentKey,
        creationId: creation.id,
        buffer: masterWav,
        fileName: "master.wav",
        mimeType: "audio/wav",
        assetType: "audio",
        metadata: {
          role: "narration",
          altText: `Full audio for ${audioPlan.title}`,
          durationSeconds: totalSeconds,
          status: "ready",
        },
      });
      finalAudioAssetId = masterAsset.id;
    }

    const visualTheme = normalizeVisualTheme(
      await generateVisualThemeFromContent({
        title: audioPlan.title,
        topic: (setup.topicIdea as string | undefined) ?? (setup.topic as string | undefined),
        category: creation.category,
        format: audioPlan.format,
        excerpt: visualThemeExcerpt(audioPlan, setup),
      }),
    );

    const manifest = audioManifestSchema.parse({
      version: 1,
      format: audioPlan.format,
      title: audioPlan.title,
      targetDurationMinutes: audioPlan.targetDurationMinutes,
      actualDurationMinutes: totalSeconds / 60,
      language: audioPlan.language,
      ...(coverAssetId ? { coverAssetId } : {}),
      speakers: audioDirection.speakers.map((s) => ({
        name: s.name,
        voice: s.voice,
        role: s.role,
      })),
      segments: segmentAssets.map((seg, sequence) => {
        const resolvedSegments = resolveTtsSegments(audioPlan, audioDirection);
        const planSeg = resolvedSegments[sequence];
        const segmentBuffer = wavBuffers[sequence];
        const segmentDuration = segmentBuffer
          ? measurePlayableWavSeconds(segmentBuffer, seg.segmentId)
          : seg.durationSeconds;
        return {
          segmentId: seg.segmentId,
          sequence,
          audioAssetId: seg.assetId,
          durationSeconds: segmentDuration,
          speakerNames:
            planSeg?.speakerNames ??
            audioDirection.speakers.map((s) => s.name).slice(0, 2),
          title: planSeg?.summary ?? `Part ${sequence + 1}`,
        };
      }),
      finalAudioAssetId,
      visualTheme,
    });

    await uploadCreationAssetBuffer({
      contentKey: creation.contentKey,
      creationId: creation.id,
      buffer: Buffer.from(JSON.stringify(manifest, null, 2)),
      fileName: "audio-manifest.json",
      mimeType: "application/json",
      assetType: "script",
      metadata: {
        role: "audio_manifest",
        altText: `Audio manifest for ${audioPlan.title}`,
      },
    });

    const excerpt = audioContentExcerpt(audioPlan, setup);
    const measuredMinutes = totalSeconds / 60;

    return {
      done: true,
      progress: 100,
      title: audioPlan.title,
      durationMinutes: Math.max(1, Math.round(measuredMinutes)),
      metadataPatch: mergeMetadata(metadata, {
        pipeline: {
          status: "completed",
          step: "audio_compose",
          completedAt: new Date().toISOString(),
        },
        display: { excerpt, visualTheme },
        audio: {
          format: audioPlan.format,
          targetDurationMinutes: audioPlan.targetDurationMinutes,
          actualDurationMinutes: measuredMinutes,
          ttsModel: metadata.pipeline.ttsModel,
          segmentCount: segmentAssets.length,
        },
        audioDirection: undefined,
      }),
    };
  }

  throw new Error(`Unknown audio step: ${step}`);
}
