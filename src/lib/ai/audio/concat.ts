/** Concatenate PCM WAV files with identical format (24kHz mono 16-bit). */

export const EXPECTED_WAV = {
  sampleRate: 24000,
  channels: 1,
  bitDepth: 16,
} as const;

export interface WavFormat {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  dataSize: number;
}

export function readWavFormat(buffer: Buffer): WavFormat {
  if (buffer.length < 44) {
    throw new Error("Invalid WAV buffer: too short");
  }
  return {
    channels: buffer.readUInt16LE(22),
    sampleRate: buffer.readUInt32LE(24),
    bitsPerSample: buffer.readUInt16LE(34),
    dataSize: buffer.readUInt32LE(40),
  };
}

export function isExpectedWavFormat(format: WavFormat): boolean {
  return (
    format.sampleRate === EXPECTED_WAV.sampleRate &&
    format.channels === EXPECTED_WAV.channels &&
    format.bitsPerSample === EXPECTED_WAV.bitDepth
  );
}

/** Re-wrap PCM payload with canonical 24kHz mono 16-bit header. */
export function rewrapPcmAsWav(pcm: Buffer): Buffer {
  const out = Buffer.alloc(44 + pcm.length);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + pcm.length, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(EXPECTED_WAV.channels, 22);
  out.writeUInt32LE(EXPECTED_WAV.sampleRate, 24);
  out.writeUInt32LE(
    EXPECTED_WAV.sampleRate *
      EXPECTED_WAV.channels *
      (EXPECTED_WAV.bitDepth / 8),
    28,
  );
  out.writeUInt16LE(
    EXPECTED_WAV.channels * (EXPECTED_WAV.bitDepth / 8),
    32,
  );
  out.writeUInt16LE(EXPECTED_WAV.bitDepth, 34);
  out.write("data", 36);
  out.writeUInt32LE(pcm.length, 40);
  pcm.copy(out, 44);
  return out;
}

export function normalizeWavBuffer(buffer: Buffer, label?: string): Buffer {
  const format = readWavFormat(buffer);
  if (isExpectedWavFormat(format)) {
    return buffer;
  }

  console.warn("[wav] normalizing format mismatch", {
    label,
    sampleRate: format.sampleRate,
    channels: format.channels,
    bitsPerSample: format.bitsPerSample,
  });

  const pcm = unwrapWavToPcm(buffer);
  return rewrapPcmAsWav(pcm);
}

export function concatenateWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) {
    throw new Error("No WAV buffers to concatenate");
  }

  const normalized = buffers.map((buf, i) =>
    normalizeWavBuffer(buf, `segment-${i}`),
  );

  if (normalized.length === 1) {
    return normalized[0]!;
  }

  const pcmChunks: Buffer[] = [];

  for (const buf of normalized) {
    if (buf.length < 44) {
      throw new Error("Invalid WAV buffer");
    }
    pcmChunks.push(unwrapWavToPcm(buf));
  }

  const pcm = Buffer.concat(pcmChunks);
  return rewrapPcmAsWav(pcm);
}

export function estimateWavDurationSeconds(buffer: Buffer): number {
  if (buffer.length < 44) {
    return 0;
  }
  const format = readWavFormat(buffer);
  const bytesPerSecond =
    format.sampleRate * format.channels * (format.bitsPerSample / 8) || 48000;
  return format.dataSize / bytesPerSecond;
}

function isWavBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WAVE"
  );
}

function unwrapWavToPcm(buffer: Buffer): Buffer {
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

const MAX_PLAUSIBLE_SEGMENT_SECONDS = 3 * 60 * 2;

/** Measure playable duration; unwrap nested WAV when header is inflated. */
export function measurePlayableWavSeconds(
  buffer: Buffer,
  label?: string,
): number {
  const normalized = normalizeWavBuffer(buffer, label);
  let duration = estimateWavDurationSeconds(normalized);

  if (duration <= MAX_PLAUSIBLE_SEGMENT_SECONDS) {
    return duration;
  }

  const pcm = unwrapWavToPcm(normalized);
  const corrected = pcmDurationSeconds(pcm);

  if (corrected > 0 && corrected < duration) {
    console.warn("[wav] correcting inflated duration measurement", {
      label,
      headerDuration: duration,
      correctedDuration: corrected,
    });
    return corrected;
  }

  return duration;
}

/** Normalize WAV and return corrected buffer when header metadata is inconsistent. */
export function repairWavBuffer(buffer: Buffer, label?: string): Buffer {
  const normalized = normalizeWavBuffer(buffer, label);

  if (normalized.length < 44) {
    return normalized;
  }

  const pcm = unwrapWavToPcm(normalized);
  const format = readWavFormat(normalized);
  const headerDuration = estimateWavDurationSeconds(normalized);

  const headerMismatch =
    !isExpectedWavFormat(format) ||
    format.dataSize !== pcm.length ||
    headerDuration <= 0 ||
    !Number.isFinite(headerDuration);

  if (headerMismatch) {
    return rewrapPcmAsWav(pcm);
  }

  if (headerDuration <= MAX_PLAUSIBLE_SEGMENT_SECONDS) {
    return normalized;
  }

  const corrected = pcmDurationSeconds(pcm);

  if (corrected > 0 && corrected < headerDuration) {
    return rewrapPcmAsWav(pcm);
  }

  return normalized;
}
