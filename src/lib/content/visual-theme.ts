import type { VisualTheme } from "@/types/content-metadata";

const MOOD_PRESETS: Record<
  VisualTheme["mood"],
  { colors: [string, string, string]; ambience: VisualTheme["ambience"] }
> = {
  calm: { colors: ["#3F72AF", "#6FA8DC", "#A8D8EA"], ambience: "particles" },
  peaceful: { colors: ["#4A6CF7", "#6E8BFF", "#A9C8FF"], ambience: "liquid" },
  adventure: { colors: ["#E87722", "#F5A623", "#FFD180"], ambience: "warm-glow" },
  horror: { colors: ["#8B0000", "#2D0505", "#C41E3A"], ambience: "fog" },
  mysterious: { colors: ["#4A148C", "#311B92", "#7E57C2"], ambience: "fog" },
  joyful: { colors: ["#FFB300", "#26A69A", "#FFF8E1"], ambience: "particles" },
  dramatic: { colors: ["#1A237E", "#3949AB", "#7986CB"], ambience: "none" },
  cozy: { colors: ["#8D6E63", "#BCAAA4", "#FFE0B2"], ambience: "warm-glow" },
  energetic: { colors: ["#FF5722", "#FF9800", "#FFEB3B"], ambience: "particles" },
  neutral: { colors: ["#546E7A", "#78909C", "#B0BEC5"], ambience: "none" },
};

export function deriveVisualTheme(input: {
  topic?: string;
  category?: string;
  format?: string;
  audience?: string;
}): VisualTheme {
  const topic = (input.topic ?? "").toLowerCase();
  const category = input.category ?? "";

  let mood: VisualTheme["mood"] = "neutral";
  let energy = 0.5;

  if (
    topic.includes("bedtime") ||
    topic.includes("sleep") ||
    topic.includes("calm")
  ) {
    mood = "calm";
    energy = 0.15;
  } else if (
    topic.includes("horror") ||
    topic.includes("scary") ||
    topic.includes("dark")
  ) {
    mood = "horror";
    energy = 0.7;
  } else if (
    topic.includes("adventure") ||
    topic.includes("quest") ||
    topic.includes("journey")
  ) {
    mood = "adventure";
    energy = 0.65;
  } else if (category === "podcast") {
    mood = "joyful";
    energy = 0.55;
  } else if (category === "audiobook") {
    mood = "peaceful";
    energy = 0.35;
  } else if (input.audience === "kids") {
    mood = "joyful";
    energy = 0.45;
  } else if (category === "story") {
    mood = "cozy";
    energy = 0.4;
  }

  const preset = MOOD_PRESETS[mood];
  return {
    mood,
    energy,
    colors: preset.colors,
    ambience: preset.ambience,
    visualStyle: mood === "horror" ? "liquid" : "mesh",
  };
}

export function mergeVisualTheme(
  primary?: VisualTheme,
  fallback?: VisualTheme,
): VisualTheme {
  return primary ?? fallback ?? deriveVisualTheme({});
}
