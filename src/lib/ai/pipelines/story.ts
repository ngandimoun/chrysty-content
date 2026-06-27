import { extractReferenceContext } from "@/lib/ai/documents/extract-reference-context";
import { generateCoverImage, generateIllustrationImage } from "@/lib/ai/image/generate";
import {
  storyCoverPrompt,
  storyIllustrationPrompt,
  storyPlanSystemInstruction,
  storyPlanUserMessage,
  storyWriteSystemInstruction,
  storyWriteUserMessage,
} from "@/lib/ai/prompts/story";
import { createTextInteraction } from "@/lib/ai/text/interactions";
import { parseModelJson } from "@/lib/ai/text/json";
import type { StepResult } from "@/lib/ai/orchestrator/types";
import {
  uploadCreationAssetBuffer,
} from "@/lib/content/assets";
import { generateVisualThemeFromContent, normalizeVisualTheme } from "@/lib/ai/mood/generate-visual-theme";
import { normalizeStoryPlanSlots } from "@/lib/ai/pipelines/story-slots";
import type { CreationRecord } from "@/lib/content/creations";
import {
  asMetadata,
  mergeMetadata,
} from "@/lib/ai/orchestrator/metadata";
import {
  bookManifestSchema,
  storyPlanSchema,
  writtenStorySchema,
  type BookBlock,
  type BookManifest,
  type CreationGenerationMetadata,
  type PipelineCheckpoint,
  type WrittenPage,
} from "@/types/content-metadata";

function getStep(metadata: CreationGenerationMetadata): string {
  return metadata.pipeline.step ?? "reference_extract";
}

function getCheckpoint(metadata: CreationGenerationMetadata): PipelineCheckpoint {
  return metadata.checkpoint ?? {};
}

function flattenSlots(pages: WrittenPage[]) {
  const slots: Array<WrittenPage["slots"][number] & { pageNumber: number }> =
    [];
  for (const page of pages) {
    for (const slot of page.slots) {
      slots.push({ ...slot, pageNumber: page.pageNumber });
    }
  }
  return slots;
}

function normalizeWrittenPages(pages: WrittenPage[]): WrittenPage[] {
  return pages.map((page) => {
    if (page.pageNumber !== 1) {
      return page;
    }

    return {
      ...page,
      paragraphs: [],
      slots: [],
      layout: "title",
    };
  });
}

function buildExcerpt(pages: WrittenPage[]): string {
  for (const page of pages) {
    const text = page.paragraphs.join(" ").trim();
    if (text.length > 0) {
      return text.slice(0, 120);
    }
  }
  return "";
}

export async function runStoryStep(
  creation: CreationRecord,
): Promise<StepResult> {
  const metadata = asMetadata(creation.metadata);
  const step = getStep(metadata);
  const checkpoint = getCheckpoint(metadata);
  const setup = creation.setup;
  const referenceContext = checkpoint.referenceContext;

  if (step === "reference_extract") {
    const assetIds = (setup.referenceFileAssetIds as string[] | undefined) ?? [];
    if (assetIds.length === 0) {
      return {
        done: false,
        nextStep: "story_plan",
        progress: 5,
        metadataPatch: mergeMetadata(metadata, {
          pipeline: { status: "planning", step: "story_plan" },
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
      nextStep: "story_plan",
      progress: 8,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: { status: "planning", step: "story_plan" },
        checkpoint: { referenceContext: extracted },
      }),
    };
  }

  if (step === "story_plan") {
    const result = await createTextInteraction({
      systemInstruction: storyPlanSystemInstruction(),
      userMessage: storyPlanUserMessage(setup, referenceContext),
    });
    const storyPlan = normalizeStoryPlanSlots(
      parseModelJson(result.text, storyPlanSchema),
    );

    return {
      done: false,
      nextStep: "story_write",
      progress: 25,
      title: storyPlan.title,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: {
          status: "planning",
          step: "story_write",
          textInteractionId: result.interactionId,
        },
        story: {
          format: "illustrated_book",
          characterBible: storyPlan.characterBible,
          illustrationStyle: storyPlan.illustrationStyle,
        },
        checkpoint: { storyPlan },
      }),
      pageCount: storyPlan.pageCount,
    };
  }

  if (step === "story_write") {
    const storyPlan = checkpoint.storyPlan;
    if (!storyPlan) {
      throw new Error("Missing story plan checkpoint");
    }

    const result = await createTextInteraction({
      systemInstruction: storyWriteSystemInstruction(),
      userMessage: storyWriteUserMessage({
        setup,
        storyPlanJson: JSON.stringify(storyPlan),
        referenceContext,
      }),
      previousInteractionId: metadata.pipeline.textInteractionId,
    });

    const written = parseModelJson(result.text, writtenStorySchema);
    const writtenPages = normalizeWrittenPages(written.pages);

    return {
      done: false,
      nextStep: "story_cover",
      progress: 50,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: {
          status: "writing",
          step: "story_cover",
          textInteractionId: result.interactionId,
        },
        checkpoint: { writtenPages },
      }),
    };
  }

  if (step === "story_cover") {
    const storyPlan = checkpoint.storyPlan;
    if (!storyPlan) {
      throw new Error("Missing story plan for cover");
    }

    const prompt = storyCoverPrompt({
      setup,
      title: storyPlan.title,
      characterBible: storyPlan.characterBible,
      illustrationStyle: storyPlan.illustrationStyle,
      referenceContext,
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
          altText: `Cover art for ${storyPlan.title}`,
          prompt,
          model: process.env.GEMINI_IMAGE_MODEL,
          aspectRatio: "3:4",
          status: "ready",
        },
      });

      coverCheckpoint.coverAssetId = asset.id;
      coverCheckpoint.coverStoragePath = asset.storage_path;
    } catch (error) {
      console.warn("[story-cover] cover generation failed, continuing without cover", {
        creationId: creation.id,
        error: error instanceof Error ? error.message : String(error),
      });
      coverCheckpoint.coverGenerationSkipped = true;
      coverCheckpoint.coverGenerationError =
        error instanceof Error ? error.message : String(error);
    }

    return {
      done: false,
      nextStep: "story_illustrate",
      progress: 60,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: {
          status: "illustrating",
          step: "story_illustrate",
          illustrationIndex: 0,
        },
        display: coverCheckpoint.coverAssetId
          ? { coverAssetId: coverCheckpoint.coverAssetId }
          : {},
        checkpoint: coverCheckpoint,
      }),
    };
  }

  if (step === "story_illustrate") {
    const storyPlan = checkpoint.storyPlan;
    const writtenPages = checkpoint.writtenPages;
    if (!storyPlan || !writtenPages) {
      throw new Error("Missing write checkpoint for illustrations");
    }

    const allSlots = flattenSlots(writtenPages);
    const index = metadata.pipeline.illustrationIndex ?? 0;

    if (index >= allSlots.length) {
      return {
        done: false,
        nextStep: "story_compose",
        progress: 85,
        metadataPatch: mergeMetadata(metadata, {
          pipeline: { step: "story_compose", status: "composing" },
        }),
      };
    }

    const slot = allSlots[index]!;
    const slotAssets = { ...(checkpoint.slotAssets ?? {}) };
    let referenceBuffer: Buffer | undefined;
    const referenceMime = "image/png";

    if (checkpoint.coverStoragePath) {
      try {
        const { downloadAssetBuffer } = await import("@/lib/content/assets");
        referenceBuffer = await downloadAssetBuffer(checkpoint.coverStoragePath);
      } catch {
        referenceBuffer = undefined;
      }
    }

    try {
      const prompt = storyIllustrationPrompt({
        illustrationStyle: storyPlan.illustrationStyle,
        characterBible: storyPlan.characterBible,
        illustrationBrief: slot.illustrationBrief,
        pageNumber: slot.pageNumber,
        referenceContext,
      });

      const image = await generateIllustrationImage({
        prompt,
        referenceImage: referenceBuffer
          ? { buffer: referenceBuffer, mimeType: referenceMime }
          : undefined,
        creationId: creation.id,
      });

      const asset = await uploadCreationAssetBuffer({
        contentKey: creation.contentKey,
        creationId: creation.id,
        buffer: image.buffer,
        fileName: `${slot.slotId}.png`,
        mimeType: image.mimeType,
        assetType: "illustration",
        metadata: {
          role:
            slot.type === "explanation"
              ? "explanation"
              : slot.type === "diagram"
                ? "diagram"
                : "illustration",
          pageNumber: slot.pageNumber,
          slotId: slot.slotId,
          altText: slot.altText,
          caption: slot.caption ?? undefined,
          prompt,
          model: process.env.GEMINI_IMAGE_MODEL,
          aspectRatio: "3:4",
          status: "ready",
        },
      });

      slotAssets[slot.slotId] = {
        assetId: asset.id,
        storagePath: asset.storage_path,
        status: "ready",
      };
    } catch {
      slotAssets[slot.slotId] = {
        assetId: "00000000-0000-0000-0000-000000000000",
        storagePath: "",
        status: "failed",
      };
    }

    const nextIndex = index + 1;
    const illustrateProgress =
      60 +
      Math.floor(((nextIndex / Math.max(allSlots.length, 1)) * 25));

    const nextStep =
      nextIndex >= allSlots.length ? "story_compose" : "story_illustrate";

    return {
      done: false,
      nextStep,
      progress: nextIndex >= allSlots.length ? 85 : illustrateProgress,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: {
          status: nextStep === "story_compose" ? "composing" : "illustrating",
          step: nextStep,
          illustrationIndex: nextIndex,
        },
        checkpoint: { slotAssets },
        display: { illustrationCount: nextIndex },
      }),
    };
  }

  if (step === "story_compose") {
    const storyPlan = checkpoint.storyPlan;
    const writtenPages = checkpoint.writtenPages;
    const coverAssetId = checkpoint.coverAssetId;
    if (!storyPlan || !writtenPages) {
      throw new Error("Missing checkpoints for compose");
    }

    const slotAssets = checkpoint.slotAssets ?? {};
    const pages = writtenPages.map((page) => {
      const blocks: BookBlock[] = [];
      if (page.heading) {
        blocks.push({ type: "heading", text: page.heading });
      }
      for (const paragraph of page.paragraphs) {
        blocks.push({ type: "paragraph", text: paragraph });
      }
      for (const slot of page.slots) {
        const asset = slotAssets[slot.slotId];
        if (asset?.status === "ready" && asset.assetId !== "00000000-0000-0000-0000-000000000000") {
          blocks.push({
            type: "illustration",
            slotId: slot.slotId,
            assetId: asset.assetId,
            placement: page.layout === "text_with_hero" ? "hero" : "inline",
            caption: slot.caption ?? undefined,
            altText: slot.altText,
            status: "ready",
          });
        }
      }
      return {
        pageNumber: page.pageNumber,
        layout: page.layout,
        blocks,
      };
    });

    const excerptPreview = buildExcerpt(writtenPages);
    const visualTheme = normalizeVisualTheme(
      await generateVisualThemeFromContent({
      title: storyPlan.title,
      topic: (creation.setup.topic as string | undefined) ?? undefined,
      category: creation.category,
      audience: storyPlan.audience,
      excerpt: excerptPreview,
      }),
    );

    const manifest: BookManifest = bookManifestSchema.parse({
      version: 1,
      format: "illustrated_book",
      title: storyPlan.title,
      pageCount: storyPlan.pageCount,
      audience: storyPlan.audience,
      ...(coverAssetId ? { coverAssetId } : {}),
      pages,
      visualTheme,
    });

    const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2));
    await uploadCreationAssetBuffer({
      contentKey: creation.contentKey,
      creationId: creation.id,
      buffer: manifestBuffer,
      fileName: "book-manifest.json",
      mimeType: "application/json",
      assetType: "script",
      metadata: {
        role: "book_manifest",
        altText: `Book manifest for ${storyPlan.title}`,
      },
    });

    const excerpt = excerptPreview;
    const readingTimeMinutes = Math.max(
      1,
      Math.ceil(storyPlan.pageCount * 1.5),
    );

    return {
      done: true,
      progress: 100,
      title: storyPlan.title,
      pageCount: storyPlan.pageCount,
      metadataPatch: mergeMetadata(metadata, {
        pipeline: {
          status: "completed",
          step: "story_compose",
          completedAt: new Date().toISOString(),
        },
        display: {
          excerpt,
          readingTimeMinutes,
          illustrationCount: Object.keys(slotAssets).length,
          visualTheme,
        },
      }),
    };
  }

  throw new Error(`Unknown story step: ${step}`);
}
