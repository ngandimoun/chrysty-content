import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getGeminiClient(): GoogleGenAI {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  return client;
}

export function getTextModel(): string {
  return process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";
}

export function getImageModel(): string {
  return process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image";
}

export function getImageFallbackModel(): string {
  return process.env.GEMINI_IMAGE_FALLBACK_MODEL ?? "gemini-2.5-flash-image";
}

export function getTtsModel(): string {
  return process.env.GEMINI_TTS_MODEL ?? "gemini-3.1-flash-tts-preview";
}

export function getResearchModel(): string {
  return process.env.GEMINI_RESEARCH_MODEL ?? "gemini-3-flash-preview";
}

export function getResearchFallbackModel(): string {
  return process.env.GEMINI_RESEARCH_FALLBACK_MODEL ?? "gemini-3.5-flash";
}

export function getTextFallbackModel(): string {
  return process.env.GEMINI_TEXT_FALLBACK_MODEL ?? "gemini-3-flash-preview";
}

export function getTtsFallbackModel(): string {
  return (
    process.env.GEMINI_TTS_FALLBACK_MODEL ?? "gemini-2.5-flash-preview-tts"
  );
}

export function getTranscribeModel(): string {
  return process.env.GEMINI_MODEL_TRANSCRIBE ?? "gemini-3.1-flash-lite";
}

export function getTranscribeFallbackModel(): string {
  return process.env.GEMINI_MODEL_TRANSCRIBE_FALLBACK ?? "gemini-3.5-flash";
}
