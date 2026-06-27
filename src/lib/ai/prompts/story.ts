import {
  jsonOutputRules,
  languageInstruction,
  referenceContextBlock,
  resolveSetupLabel,
  storyPageCount,
} from "./shared";

function storyProseGuidance(audience: string): string {
  switch (audience) {
    case "kids":
      return "2-4 paragraphs per page (~80-120 words), except page 1";
    case "teen":
      return "2-4 paragraphs per page (~120-180 words), except page 1";
    default:
      return "3-5 paragraphs per page (~150-250 words), except page 1";
  }
}

export function storyPlanSystemInstruction(): string {
  return `You are a children's and YA illustrated book planner for Chrysty Creative Library.
You produce structured story plans with sparse illustration slots, character bibles, and page layouts.
Story prose carries the narrative; illustrations accent key moments only.
${jsonOutputRules()}`;
}

export function storyPlanUserMessage(
  setup: Record<string, unknown>,
  referenceContext?: string,
): string {
  const pageCount = storyPageCount(setup);
  const audience = String(setup.audience ?? "adult");
  const storyType = resolveSetupLabel(
    String(setup.storyType ?? ""),
    setup.storyTypeCustom as string | undefined,
  );
  const mainIdea = String(setup.mainIdea ?? "");
  const language = String(setup.language ?? "en");

  const slotDensity =
    audience === "kids"
      ? "At least one visual slot every 3-4 pages (not every page)."
      : "At least one visual slot every 4-5 pages (not every page).";

  return `${languageInstruction(language)}

Create a story plan JSON for an illustrated book.

Requirements:
- Exactly ${pageCount} pages (hard limit)
- Audience: ${audience}
- Story type: ${storyType}
- Main idea: ${mainIdea}
- Page 1 layout must be "title" with zero illustration slots (cover art serves page 1)
- Max 1 illustration slot per page (pages 2+ only)
- ${slotDensity}
- Use text_only or sparse layouts on transition pages
- Place slots only at major scene changes, emotional beats, or new concepts — never trivial actions
- Slot types: illustration, explanation, or diagram
- Stable slot IDs: illus_p{page}_s{index}
- Include characterBible and illustrationStyle

Output JSON shape:
{
  "title": string,
  "pageCount": ${pageCount},
  "audience": "${audience}",
  "illustrationStyle": string,
  "characterBible": string,
  "pages": [
    {
      "pageNumber": number,
      "layout": "title" | "text_with_hero" | "text_with_inline" | "text_only",
      "summary": string,
      "slots": [{ "slotId": string, "type": "illustration"|"explanation"|"diagram", "briefHint": string }]
    }
  ]
}${referenceContextBlock(referenceContext)}`;
}

export function storyWriteSystemInstruction(): string {
  return `You are an illustrated book writer. Rich, engaging prose is your primary output.
Illustration briefs are short supporting metadata — never let them crowd out the story.
${jsonOutputRules()}`;
}

export function storyWriteUserMessage(input: {
  setup: Record<string, unknown>;
  storyPlanJson: string;
  referenceContext?: string;
}): string {
  const language = String(input.setup.language ?? "en");
  const audience = String(input.setup.audience ?? "adult");
  const proseGuidance = storyProseGuidance(audience);

  return `${languageInstruction(language)}

Using this story plan, write full page content for ALL pages in one JSON object.

Story plan:
${input.storyPlanJson}

Writing priorities:
- Story prose is the primary output. Do not shorten paragraphs to make room for illustration metadata.
- Audience: ${audience}. Target ${proseGuidance}.
- Page 1 (title layout): heading and optional subtitle only — no body paragraphs, no slots.
- Pages with slots: keep illustrationBrief to 1-2 sentences max (enough for image generation, not a second story).

For each page output:
- pageNumber, layout (from plan)
- heading (optional string)
- paragraphs (string array)
- slots: each with slotId, type, illustrationBrief (concise, quotes character bible), altText, optional caption

Output JSON:
{
  "pages": [
    {
      "pageNumber": number,
      "layout": string,
      "heading": string | null,
      "paragraphs": string[],
      "slots": [
        {
          "slotId": string,
          "type": "illustration"|"explanation"|"diagram",
          "illustrationBrief": string,
          "altText": string,
          "caption": string | null
        }
      ]
    }
  ]
}${referenceContextBlock(input.referenceContext)}`;
}

export function storyCoverPrompt(input: {
  setup: Record<string, unknown>;
  title: string;
  characterBible: string;
  illustrationStyle: string;
  referenceContext?: string;
}): string {
  const storyType = resolveSetupLabel(
    String(input.setup.storyType ?? ""),
    input.setup.storyTypeCustom as string | undefined,
  );
  const audience = String(input.setup.audience ?? "adult");
  const mainIdea = String(input.setup.mainIdea ?? "");

  return `Illustrated book cover art for "${input.title}".
Genre: ${storyType}. Audience: ${audience}. Theme: ${mainIdea}.
Style: ${input.illustrationStyle}.
Characters: ${input.characterBible}.
Soft, inviting cover composition. No readable body text or paragraphs. Clean art suitable for a library card thumbnail. Portrait 3:4 aspect ratio.${referenceContextBlock(input.referenceContext)}`;
}

export function storyIllustrationPrompt(input: {
  illustrationStyle: string;
  characterBible: string;
  illustrationBrief: string;
  pageNumber: number;
  referenceContext?: string;
}): string {
  return `Create an in-story illustration for page ${input.pageNumber}.
Style: ${input.illustrationStyle}.
Character bible: ${input.characterBible}.
Scene brief: ${input.illustrationBrief}.
Match the established visual style. No speech bubbles with long text.${referenceContextBlock(input.referenceContext)}`;
}
