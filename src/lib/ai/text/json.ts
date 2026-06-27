import type { z } from "zod";

export function extractJsonFromText(text: string): unknown {
  const trimmed = text.trim();

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim());
  }

  const start = trimmed.indexOf("{");
  const arrayStart = trimmed.indexOf("[");
  const jsonStart =
    start === -1
      ? arrayStart
      : arrayStart === -1
        ? start
        : Math.min(start, arrayStart);

  if (jsonStart === -1) {
    throw new Error("No JSON object found in model response");
  }

  const slice = trimmed.slice(jsonStart);
  return JSON.parse(slice);
}

export function parseModelJson<T extends z.ZodType>(
  text: string,
  schema: T,
): z.infer<T> {
  const raw = extractJsonFromText(text);
  return schema.parse(raw);
}
