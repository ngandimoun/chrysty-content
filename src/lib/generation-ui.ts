import type { Creation, CreationCategory } from "@/types/creation";

export interface CategoryAccent {
  overlay: string;
  glow: string;
  progress: string;
  ring: string;
}

const CATEGORY_ACCENTS: Record<CreationCategory, CategoryAccent> = {
  story: {
    overlay: "from-violet-500/30 via-fuchsia-400/20 to-transparent",
    glow: "bg-violet-400/40",
    progress: "bg-gradient-to-r from-violet-500 to-fuchsia-400",
    ring: "ring-violet-400/30",
  },
  audiobook: {
    overlay: "from-indigo-500/30 via-blue-400/20 to-transparent",
    glow: "bg-indigo-400/40",
    progress: "bg-gradient-to-r from-indigo-500 to-blue-400",
    ring: "ring-indigo-400/30",
  },
  podcast: {
    overlay: "from-emerald-500/30 via-teal-400/20 to-transparent",
    glow: "bg-emerald-400/40",
    progress: "bg-gradient-to-r from-emerald-500 to-teal-400",
    ring: "ring-emerald-400/30",
  },
};

const STEP_HEADLINES: Record<string, string> = {
  story_plan: "Planning your story",
  story_write: "Writing pages",
  story_cover: "Designing the cover",
  story_illustrate: "Painting illustrations",
  story_compose: "Assembling your book",
  audio_plan: "Planning your audio",
  audio_director: "Writing and directing your audio",
  audio_cover: "Creating cover art",
  audio_tts: "Recording narration",
  audio_compose: "Mixing final audio",
};

const SUB_MESSAGES: Record<string, string[]> = {
  story_plan: [
    "Mapping characters and scenes…",
    "Choosing illustration moments…",
    "Building the story outline…",
  ],
  story_write: [
    "Crafting page-by-page prose…",
    "Balancing text and visuals…",
    "Shaping the narrative arc…",
  ],
  story_cover: [
    "Capturing the mood in art…",
    "Designing a library-worthy cover…",
    "Setting the visual tone…",
  ],
  story_illustrate: [
    "Bringing scenes to life…",
    "Keeping characters consistent…",
    "Adding color and wonder…",
  ],
  story_compose: [
    "Linking pages and images…",
    "Preparing your illustrated book…",
    "Almost ready to read…",
  ],
  audio_plan: [
    "Picking voices and pacing…",
    "Estimating duration…",
    "Structuring segments…",
  ],
  audio_director: [
    "Writing with performance tags…",
    "Setting scene and tone…",
    "Preparing for synthesis…",
  ],
  audio_cover: [
    "Designing episode artwork…",
    "Matching audio to visuals…",
    "Crafting the thumbnail…",
  ],
  audio_tts: [
    "Synthesizing speech…",
    "Recording segment by segment…",
    "Adding expressive delivery…",
  ],
  audio_compose: [
    "Stitching audio segments…",
    "Building the manifest…",
    "Almost ready to listen…",
  ],
};

const CATEGORY_DEFAULT_HEADLINES: Record<CreationCategory, string> = {
  story: "Creating your illustrated book",
  audiobook: "Producing your audiobook",
  podcast: "Producing your podcast",
};

const CATEGORY_DEFAULT_SUBS: Record<CreationCategory, string[]> = {
  story: [
    "AI is crafting something special…",
    "Good stories take a moment…",
    "Pages and pictures incoming…",
  ],
  audiobook: [
    "Voices and narration loading…",
    "Your chapter is taking shape…",
    "Almost time to press play…",
  ],
  podcast: [
    "Hosts are warming up…",
    "Episode energy building…",
    "Your show is coming together…",
  ],
};

export function getCategoryAccent(category: CreationCategory): CategoryAccent {
  return CATEGORY_ACCENTS[category];
}

export function getGenerationHeadline(creation: Creation): string {
  if (creation.status === "failed") {
    return "Generation paused";
  }

  const step = creation.pipelineStep;
  if (step && STEP_HEADLINES[step]) {
    return STEP_HEADLINES[step];
  }

  if (creation.pipelineStatus === "planning") {
    return `Planning your ${creation.category}`;
  }
  if (creation.pipelineStatus === "writing") {
    return "Writing content";
  }
  if (creation.pipelineStatus === "illustrating") {
    return "Creating visuals";
  }
  if (creation.pipelineStatus === "composing") {
    return "Finishing touches";
  }

  return CATEGORY_DEFAULT_HEADLINES[creation.category];
}

export function getGenerationSubMessages(creation: Creation): string[] {
  const step = creation.pipelineStep;
  if (step && SUB_MESSAGES[step]) {
    return SUB_MESSAGES[step];
  }
  return CATEGORY_DEFAULT_SUBS[creation.category];
}

export function pickRotatingMessage(
  messages: string[],
  tick: number,
): string {
  if (messages.length === 0) return "";
  return messages[tick % messages.length]!;
}

export function isCreationGenerating(creation: Creation): boolean {
  return creation.status === "generating";
}

export function isCreationFailed(creation: Creation): boolean {
  return creation.status === "failed";
}
