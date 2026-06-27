import { createTextInteraction } from "@/lib/ai/text/interactions";
import { parseModelJson } from "@/lib/ai/text/json";
import { deriveVisualTheme } from "@/lib/content/visual-theme";
import { visualThemeSchema, type VisualTheme } from "@/types/content-metadata";

const moodPrompt = `Return JSON only for the visual atmosphere of this content.
Schema: { "mood": "calm"|"peaceful"|"adventure"|"horror"|"mysterious"|"joyful"|"dramatic"|"cozy"|"energetic"|"neutral", "energy": 0-1, "colors": ["#hex","#hex","#hex"], "ambience": "none"|"rain"|"fog"|"particles"|"liquid"|"space"|"warm-glow", "visualStyle": "gradient"|"liquid"|"mesh"|"minimal" }`;

export async function generateVisualThemeFromContent(input: {
  title: string;
  topic?: string;
  category: string;
  excerpt?: string;
  format?: string;
  audience?: string;
}): Promise<VisualTheme> {
  try {
    const result = await createTextInteraction({
      userMessage: `${moodPrompt}\n\nTitle: ${input.title}\nCategory: ${input.category}\nTopic: ${input.topic ?? "general"}\nFormat: ${input.format ?? input.category}\nAudience: ${input.audience ?? "general"}\nExcerpt: ${(input.excerpt ?? "").slice(0, 400)}`,
      temperature: 0.4,
    });
    return parseModelJson(result.text, visualThemeSchema);
  } catch {
    return deriveVisualTheme(input);
  }
}

export function normalizeVisualTheme(theme: VisualTheme): VisualTheme {
  if (theme.energy >= 0.72 && theme.visualStyle === "mesh") {
    return { ...theme, visualStyle: "r3f" };
  }
  return theme;
}
