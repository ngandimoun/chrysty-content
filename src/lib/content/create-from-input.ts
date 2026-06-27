import type { CreationInput } from "@/features/creation/types";
import type { CreationType } from "@/types/creation";

import { CUSTOM_VALUE } from "@/features/creation/creation-options";

const GRADIENTS = [
  "from-violet-400 via-purple-500 to-indigo-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-amber-300 via-orange-400 to-red-400",
  "from-sky-400 via-blue-500 to-indigo-500",
  "from-rose-300 via-pink-400 to-fuchsia-500",
  "from-indigo-400 via-violet-500 to-purple-600",
] as const;

function pickGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % GRADIENTS.length;
  }
  return GRADIENTS[hash] ?? GRADIENTS[0];
}

function truncateTitle(text: string, max = 60): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function resolveLabel(value: string, custom?: string): string {
  if (value === CUSTOM_VALUE && custom?.trim()) {
    return custom.trim();
  }
  return value.replace(/_/g, " ");
}

export interface CreationInsertPayload {
  title: string;
  type: CreationType;
  category: "story" | "audiobook" | "podcast";
  contentSubtype?: string;
  topic?: string;
  description?: string;
  pageCount?: number;
  artworkGradient: string;
  setup: CreationInput;
}

export function buildCreationFromInput(input: CreationInput): CreationInsertPayload {
  if (input.category === "story") {
    const subtype = resolveLabel(input.storyType, input.storyTypeCustom);
    const type: CreationType =
      input.storyType === "bedtime_story" ? "bedtime_story" : "story";
    const pageCount =
      input.length === "custom"
        ? input.lengthCustom
        : Number.parseInt(input.length, 10);

    return {
      title: truncateTitle(input.mainIdea),
      type,
      category: "story",
      contentSubtype: subtype,
      topic: input.mainIdea.trim(),
      description: `${subtype} for ${input.audience} audience`,
      pageCount: Number.isFinite(pageCount) ? pageCount : undefined,
      artworkGradient: pickGradient(input.mainIdea),
      setup: input,
    };
  }

  if (input.category === "audiobook") {
    const subtype = resolveLabel(input.audiobookType, input.audiobookTypeCustom);
    const voice = resolveLabel(input.voiceStyle, input.voiceStyleCustom);

    return {
      title: truncateTitle(input.topicIdea),
      type: "audiobook",
      category: "audiobook",
      contentSubtype: subtype,
      topic: input.topicIdea.trim(),
      description: `Voice style: ${voice}`,
      artworkGradient: pickGradient(input.topicIdea),
      setup: input,
    };
  }

  const subtype = resolveLabel(input.podcastType, input.podcastTypeCustom);
  const type: CreationType = input.podcastType === "news" ? "brief" : "podcast";

  return {
    title: truncateTitle(input.topicIdea),
    type,
    category: "podcast",
    contentSubtype: subtype,
    topic: input.topicIdea.trim(),
    description: subtype,
    artworkGradient: pickGradient(input.topicIdea),
    setup: input,
  };
}
