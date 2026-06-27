import wav from "wav";

import {
  errorMessage,
  isModelUnavailableError,
  isPolicyBlockedError,
} from "@/lib/ai/gemini-errors";
import {
  getGeminiClient,
  getTtsFallbackModel,
  getTtsModel,
} from "@/lib/ai/gemini-client";
import type { AudioDirection } from "@/types/content-metadata";

import {
  estimateWavDurationSeconds,
  EXPECTED_WAV,
  normalizeWavBuffer,
  rewrapPcmAsWav,
} from "./concat";

export type TtsInputMode = "full" | "minimal" | "sanitized";

const TTS_PREAMBLE =
  "Synthesize speech for an audiobook/podcast narration. Read the transcript aloud with the delivery notes below. Do not generate new text.";

const HIGH_RISK_TAGS =
  /\[(shouting|panicked|screams|screaming|terrified|violent|aggressive|blood|gunshot|death)\]/gi;

const MAX_SEGMENT_SECONDS = 3 * 60 * 2;

function isWavBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WAVE"
  );
}

function unwrapToPcm(buffer: Buffer): Buffer {
  let current = buffer;
  let depth = 0;
  while (isWavBuffer(current) && current.length >= 44 && depth < 4) {
    const payload = current.subarray(44);
    if (payload.length >= 12 && isWavBuffer(payload)) {
      current = payload;
      depth += 1;
      continue;
    }
    return payload;
  }
  return current;
}

function pcmDurationSeconds(pcm: Buffer): number {
  const bytesPerSecond =
    EXPECTED_WAV.sampleRate *
    EXPECTED_WAV.channels *
    (EXPECTED_WAV.bitDepth / 8);
  return pcm.length / bytesPerSecond;
}

async function decodeTtsAudioToWav(
  raw: Buffer,
  label?: string,
): Promise<Buffer> {
  let wavBuffer: Buffer;
  if (isWavBuffer(raw)) {
    wavBuffer = normalizeWavBuffer(raw, label);
  } else {
    wavBuffer = await pcmToWav(raw);
  }

  let duration = estimateWavDurationSeconds(wavBuffer);
  if (duration <= MAX_SEGMENT_SECONDS) {
    return wavBuffer;
  }

  const pcm = unwrapToPcm(wavBuffer);
  const correctedDuration = pcmDurationSeconds(pcm);

  if (correctedDuration > 0 && correctedDuration < duration) {
    console.warn("[tts] correcting inflated WAV duration", {
      label,
      headerDuration: duration,
      correctedDuration,
    });
    return rewrapPcmAsWav(pcm);
  }

  return wavBuffer;
}

function pcmToWav(pcmData: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });
    writer.on("data", (chunk: Buffer) => chunks.push(chunk));
    writer.on("finish", () => resolve(Buffer.concat(chunks)));
    writer.on("error", reject);
    writer.write(pcmData);
    writer.end();
  });
}

function trimTtsPrompt(ttsPrompt: string): string {
  const transcriptMarker = ttsPrompt.search(/####\s*TRANSCRIPT/i);
  if (transcriptMarker >= 0) {
    return ttsPrompt.slice(0, transcriptMarker).trim();
  }
  return ttsPrompt.trim();
}

function sanitizeTranscript(transcript: string): string {
  return transcript.replace(HIGH_RISK_TAGS, "[serious]");
}

export function buildTtsInput(
  direction: AudioDirection,
  transcript: string,
  mode: TtsInputMode,
): string {
  const effectiveTranscript =
    mode === "sanitized" ? sanitizeTranscript(transcript) : transcript;

  if (mode === "full") {
    return `${TTS_PREAMBLE}\n\n${direction.ttsPrompt}\n\n#### TRANSCRIPT\n${effectiveTranscript}`;
  }

  const trimmedPrompt = trimTtsPrompt(direction.ttsPrompt);
  return `${TTS_PREAMBLE}\n\n${trimmedPrompt}\n\n#### TRANSCRIPT\n${effectiveTranscript}`;
}

async function synthesizeWithModel(input: {
  model: string;
  direction: AudioDirection;
  transcript: string;
  mode: TtsInputMode;
}): Promise<{ wavBuffer: Buffer; interactionId: string; model: string }> {
  const ai = getGeminiClient();
  const ttsInput = buildTtsInput(input.direction, input.transcript, input.mode);

  const speechConfig =
    input.direction.mode === "multi_speaker"
      ? input.direction.speakers
          .filter((s) => input.transcript.includes(`${s.name}:`))
          .slice(0, 2)
          .map((s) => ({ speaker: s.name, voice: s.voice }))
      : [{ voice: input.direction.speakers[0]!.voice }];

  const interaction = await ai.interactions.create({
    model: input.model,
    input: ttsInput,
    response_format: { type: "audio" },
    generation_config: {
      speech_config: speechConfig,
    },
  });

  const audioData = interaction.output_audio?.data;
  if (!audioData) {
    throw new Error("TTS returned no audio data");
  }

  const pcm = Buffer.from(audioData, "base64");
  const wavBuffer = await decodeTtsAudioToWav(pcm, input.model);

  return {
    wavBuffer,
    interactionId: interaction.id ?? "",
    model: input.model,
  };
}

type TtsAttempt = {
  model: string;
  mode: TtsInputMode;
  label: string;
};

function buildAttemptChain(primary: string, fallback: string): TtsAttempt[] {
  return [
    { model: primary, mode: "full", label: "primary/full" },
    { model: fallback, mode: "full", label: "fallback/full" },
    { model: fallback, mode: "minimal", label: "fallback/minimal" },
    { model: fallback, mode: "sanitized", label: "fallback/sanitized" },
  ];
}

export async function synthesizeSpeech(input: {
  direction: AudioDirection;
  segmentTranscript?: string;
  segmentId?: string;
  creationId?: string;
}): Promise<{ wavBuffer: Buffer; interactionId: string; ttsModel: string }> {
  const primary = getTtsModel();
  const fallback = getTtsFallbackModel();
  const transcript = input.segmentTranscript ?? input.direction.transcript;
  const attempts = buildAttemptChain(primary, fallback);
  let lastError: unknown;

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i]!;
    try {
      if (i > 0) {
        console.info("[tts] retry", {
          attempt: i + 1,
          strategy: attempt.label,
          creationId: input.creationId,
          segmentId: input.segmentId,
        });
      }

      const result = await synthesizeWithModel({
        model: attempt.model,
        direction: input.direction,
        transcript,
        mode: attempt.mode,
      });

      return {
        wavBuffer: result.wavBuffer,
        interactionId: result.interactionId,
        ttsModel: result.model,
      };
    } catch (error) {
      lastError = error;
      const retryable =
        isModelUnavailableError(error) || isPolicyBlockedError(error);
      const hasNext = i < attempts.length - 1;

      if (!retryable || !hasNext) {
        throw error;
      }

      console.warn("[tts] attempt failed, trying next strategy", {
        attempt: i + 1,
        strategy: attempt.label,
        creationId: input.creationId,
        segmentId: input.segmentId,
        error: errorMessage(error),
      });
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("TTS synthesis failed");
}
