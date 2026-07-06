import lamejs from "lamejs";

import {
  normalizeWavBuffer,
  readWavFormat,
  repairWavBuffer,
} from "@/lib/ai/audio/concat";

const MP3_BITRATE_KBPS = 128;
const MP3_ENCODE_SAMPLES = 1152;

function pcmInt16FromWav(wavBuffer: Buffer): {
  samples: Int16Array;
  channels: number;
  sampleRate: number;
} {
  const normalized = normalizeWavBuffer(wavBuffer);
  const format = readWavFormat(normalized);
  const pcm = normalized.subarray(44);

  return {
    samples: new Int16Array(
      pcm.buffer,
      pcm.byteOffset,
      pcm.byteLength / 2,
    ),
    channels: format.channels,
    sampleRate: format.sampleRate,
  };
}

export function encodeWavBufferToMp3(
  wavBuffer: Buffer,
  label?: string,
): Buffer {
  const wav = repairWavBuffer(wavBuffer, label);
  const { samples, channels, sampleRate } = pcmInt16FromWav(wav);
  const encoder = new lamejs.Mp3Encoder(
    channels,
    sampleRate,
    MP3_BITRATE_KBPS,
  );

  const mp3Chunks: Buffer[] = [];

  for (let offset = 0; offset < samples.length; offset += MP3_ENCODE_SAMPLES) {
    const chunk = samples.subarray(offset, offset + MP3_ENCODE_SAMPLES);
    const encoded = encoder.encodeBuffer(chunk);
    if (encoded.length > 0) {
      mp3Chunks.push(Buffer.from(encoded));
    }
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) {
    mp3Chunks.push(Buffer.from(flushed));
  }

  if (mp3Chunks.length === 0) {
    throw new Error("MP3 encoding produced no output");
  }

  return Buffer.concat(mp3Chunks);
}
