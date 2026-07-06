"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { resolveAudioDurationSeconds } from "@/lib/content/audio-duration";
import type { AudioManifest } from "@/types/content-metadata";

const MEDIA_ERR_ABORTED = 1;
const MEDIA_ERR_NETWORK = 2;
const MEDIA_ERR_DECODE = 3;
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

function sanitizeElementDuration(rawDuration: number): number {
  return Number.isFinite(rawDuration) && rawDuration >= 1
    ? rawDuration
    : 0;
}

function resolvePlaybackDuration(
  rawDuration: number,
  manifest: AudioManifest,
  format: AudioManifest["format"],
): number {
  const measured = sanitizeElementDuration(rawDuration);
  return resolveAudioDurationSeconds({
    category: format,
    targetMinutes: manifest.targetDurationMinutes,
    storedActualMinutes: manifest.actualDurationMinutes,
    measuredSeconds: measured > 0 ? measured : undefined,
  });
}

function resolveManifestTotalSeconds(
  manifest: AudioManifest,
  playbackDuration: number,
): number {
  if (playbackDuration > 0) {
    return playbackDuration;
  }
  return resolveAudioDurationSeconds({
    category: manifest.format,
    targetMinutes: manifest.targetDurationMinutes,
    storedActualMinutes: manifest.actualDurationMinutes,
  });
}

function resolveMediaErrorMessage(code: number | undefined): string {
  switch (code) {
    case MEDIA_ERR_NETWORK:
      return "Audio could not be loaded (network error)";
    case MEDIA_ERR_DECODE:
      return "Audio could not be decoded — try refreshing or use a different device";
    case MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "This audio file could not be loaded in your browser";
    default:
      return "Audio could not be loaded";
  }
}

function audioSrcMatchesUrl(audio: HTMLAudioElement, audioUrl: string): boolean {
  if (!audio.src || !audioUrl) return false;
  try {
    const expected = new URL(audioUrl, window.location.origin).href;
    return audio.src === expected || audio.src.endsWith(audioUrl);
  } catch {
    return audio.src.includes(audioUrl);
  }
}

async function probeAudioUrl(audioUrl: string): Promise<string | null> {
  try {
    const isApiProxy =
      audioUrl.startsWith("/") ||
      audioUrl.startsWith(`${window.location.origin}/api/`);
    const response = await fetch(audioUrl, {
      method: "HEAD",
      credentials: isApiProxy ? "include" : "omit",
    });

    if (response.status === 401 || response.status === 403) {
      return "Session expired — refresh the page and sign in again";
    }

    if (!response.ok) {
      return "Audio could not be loaded";
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (
      contentType.includes("application/json") ||
      contentType.includes("text/html")
    ) {
      return "Server returned an error instead of audio — try refreshing the page";
    }

    return null;
  } catch {
    return null;
  }
}

interface UseAudioPlaybackOptions {
  enabled?: boolean;
  onSeek?: (from: number, to: number) => void;
}

type AudioBindings = {
  cleanup: () => void;
};

export function useAudioPlayback(
  manifest: AudioManifest,
  assets: Record<string, string>,
  options: UseAudioPlaybackOptions = {},
) {
  const onSeekRef = useRef(options.onSeek);
  onSeekRef.current = options.onSeek;
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioBindingsRef = useRef<AudioBindings | null>(null);
  const audioUrlRef = useRef<string | undefined>(undefined);
  const manifestRef = useRef(manifest);
  manifestRef.current = manifest;
  const lastSeekEmitRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(() =>
    resolveManifestTotalSeconds(manifest, 0),
  );
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [measuredSegmentOffsets, setMeasuredSegmentOffsets] = useState<number[]>(
    [],
  );
  const [audioReady, setAudioReady] = useState(false);
  const [audioLoadError, setAudioLoadError] = useState<string | null>(null);

  const audioUrl = useMemo(() => {
    if (manifest.finalAudioAssetId && assets[manifest.finalAudioAssetId]) {
      return assets[manifest.finalAudioAssetId];
    }
    const first = manifest.segments[0];
    return first ? assets[first.audioAssetId] : undefined;
  }, [manifest, assets]);

  audioUrlRef.current = audioUrl;

  const resolvedTotalSeconds = useMemo(
    () => resolveManifestTotalSeconds(manifest, duration),
    [manifest, duration],
  );

  const displayDuration = resolvedTotalSeconds;

  const manifestDurationKey = useMemo(
    () =>
      [
        manifest.format,
        manifest.targetDurationMinutes,
        manifest.actualDurationMinutes,
        manifest.segments.length,
      ].join(":"),
    [
      manifest.format,
      manifest.targetDurationMinutes,
      manifest.actualDurationMinutes,
      manifest.segments.length,
    ],
  );

  useEffect(() => {
    setDuration(resolveManifestTotalSeconds(manifest, 0));
  }, [manifest, manifestDurationKey]);

  const plannedSegmentOffsets = useMemo(() => {
    const total = resolvedTotalSeconds;
    if (total <= 0 || manifest.segments.length === 0) {
      let offset = 0;
      return manifest.segments.map((seg) => {
        const start = offset;
        offset += seg.durationSeconds;
        return start;
      });
    }

    const plannedTotal = manifest.segments.reduce(
      (sum, s) => sum + s.durationSeconds,
      0,
    );
    if (plannedTotal <= 0) {
      return manifest.segments.map((_, i) => (i === 0 ? 0 : total));
    }

    let offset = 0;
    return manifest.segments.map((seg) => {
      const start = offset;
      offset += (seg.durationSeconds / plannedTotal) * total;
      return start;
    });
  }, [manifest.segments, resolvedTotalSeconds]);

  const segmentOffsets =
    measuredSegmentOffsets.length === manifest.segments.length &&
    measuredSegmentOffsets.length > 0
      ? measuredSegmentOffsets
      : plannedSegmentOffsets;

  const segmentOffsetsRef = useRef(segmentOffsets);
  segmentOffsetsRef.current = segmentOffsets;

  const unbindAudioElement = useCallback(() => {
    audioBindingsRef.current?.cleanup();
    audioBindingsRef.current = null;
  }, []);

  const bindAudioElement = useCallback(
    (audio: HTMLAudioElement | null) => {
      unbindAudioElement();

      if (!audio || !audioUrlRef.current) {
        setAudioReady(false);
        setAudioLoadError(null);
        return;
      }

      setAudioReady(false);
      setAudioLoadError(null);

      const currentManifest = manifestRef.current;

      const recomputeOffsets = (playbackDuration: number) => {
        const total = playbackDuration;
        if (total <= 0 || currentManifest.segments.length === 0) return;

        const plannedTotal = currentManifest.segments.reduce(
          (sum, s) => sum + s.durationSeconds,
          0,
        );
        if (plannedTotal <= 0) {
          setMeasuredSegmentOffsets(
            currentManifest.segments.map((_, i) =>
              i === 0 ? 0 : (total / currentManifest.segments.length) * i,
            ),
          );
          return;
        }

        let offset = 0;
        const offsets = currentManifest.segments.map((seg) => {
          const start = offset;
          offset += (seg.durationSeconds / plannedTotal) * total;
          return start;
        });
        setMeasuredSegmentOffsets(offsets);
      };

      const onReady = () => {
        if (audio !== audioElementRef.current) return;
        setAudioReady(true);
        setAudioLoadError(null);
      };

      const onError = () => {
        if (audio !== audioElementRef.current) return;

        const url = audioUrlRef.current;
        if (!url || !audioSrcMatchesUrl(audio, url)) return;

        const code = audio.error?.code;
        if (code === MEDIA_ERR_ABORTED) return;

        if (process.env.NODE_ENV === "development") {
          console.warn("[audio-playback] media error", {
            code,
            networkState: audio.networkState,
            readyState: audio.readyState,
            src: audio.src,
          });
        }

        setAudioReady(false);
        setAudioLoadError(resolveMediaErrorMessage(code));
      };

      const onTime = () => {
        setCurrentTime(audio.currentTime);
        const offsets = segmentOffsetsRef.current;
        const idx = offsets.findIndex((start, i) => {
          const next = offsets[i + 1] ?? Infinity;
          return audio.currentTime >= start && audio.currentTime < next;
        });
        if (idx >= 0) setActiveSegmentIndex(idx);
      };

      const onMeta = () => {
        const resolved = resolvePlaybackDuration(
          sanitizeElementDuration(audio.duration),
          currentManifest,
          currentManifest.format,
        );
        setDuration(resolved);
        recomputeOffsets(resolved);
      };

      const onEnd = () => setPlaying(false);
      const onPlay = () => setPlaying(true);
      const onPause = () => setPlaying(false);
      const onSeeked = () => {
        const now = audio.currentTime;
        if (Math.abs(now - lastSeekEmitRef.current) > 0.5) {
          onSeekRef.current?.(lastSeekEmitRef.current, now);
        }
        lastSeekEmitRef.current = now;
      };

      audio.addEventListener("loadedmetadata", onReady);
      audio.addEventListener("canplay", onReady);
      audio.addEventListener("error", onError);
      audio.addEventListener("timeupdate", onTime);
      audio.addEventListener("loadedmetadata", onMeta);
      audio.addEventListener("durationchange", onMeta);
      audio.addEventListener("ended", onEnd);
      audio.addEventListener("play", onPlay);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("seeked", onSeeked);

      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
        onReady();
        onMeta();
      }

      audioBindingsRef.current = {
        cleanup: () => {
          audio.removeEventListener("loadedmetadata", onReady);
          audio.removeEventListener("canplay", onReady);
          audio.removeEventListener("error", onError);
          audio.removeEventListener("timeupdate", onTime);
          audio.removeEventListener("loadedmetadata", onMeta);
          audio.removeEventListener("durationchange", onMeta);
          audio.removeEventListener("ended", onEnd);
          audio.removeEventListener("play", onPlay);
          audio.removeEventListener("pause", onPause);
          audio.removeEventListener("seeked", onSeeked);
        },
      };
    },
    [unbindAudioElement],
  );

  const audioRef = useCallback(
    (node: HTMLAudioElement | null) => {
      audioElementRef.current = node;
      bindAudioElement(node);
    },
    [bindAudioElement],
  );

  useEffect(() => {
    bindAudioElement(audioElementRef.current);
  }, [audioUrl, bindAudioElement]);

  useEffect(() => {
    if (!audioUrl) {
      setAudioLoadError(null);
      return;
    }

    let cancelled = false;
    setAudioLoadError(null);

    void probeAudioUrl(audioUrl).then((message) => {
      if (!cancelled && message) {
        setAudioReady(false);
        setAudioLoadError(message);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  useEffect(() => unbindAudioElement, [unbindAudioElement]);

  const seekTo = useCallback(
    (time: number) => {
      const audio = audioElementRef.current;
      if (!audio) return;
      const from = audio.currentTime;
      const to = Math.max(0, Math.min(time, duration || Infinity));
      audio.currentTime = to;
      setCurrentTime(to);
      lastSeekEmitRef.current = from;
      onSeekRef.current?.(from, to);
    },
    [duration],
  );

  const togglePlay = useCallback(async () => {
    const audio = audioElementRef.current;
    if (!audio || !audioUrl) return;
    if (!audioReady) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === "AbortError") {
          return;
        }
        if (error.name === "NotSupportedError") {
          setAudioReady(false);
          setAudioLoadError(
            "Playback is not supported on this device — try refreshing the page",
          );
          return;
        }
        if (error.name === "NotAllowedError") {
          setAudioLoadError(
            "Tap play again to start audio — your browser blocked autoplay",
          );
          return;
        }
      }
      throw error;
    }
  }, [audioReady, audioUrl]);

  const jumpToSegment = useCallback(
    (index: number) => {
      const start = segmentOffsets[index] ?? 0;
      seekTo(start);
      setActiveSegmentIndex(index);
    },
    [segmentOffsets, seekTo],
  );

  const restorePosition = useCallback(
    (seconds: number): boolean => {
      const audio = audioElementRef.current;
      if (!audio) return false;

      const total =
        duration || resolvePlaybackDuration(0, manifest, manifest.format);
      if (total <= 0) return false;

      const target = Math.max(0, Math.min(seconds, total));
      const apply = () => {
        audio.currentTime = target;
        setCurrentTime(target);
        lastSeekEmitRef.current = target;
      };

      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        apply();
        return true;
      }

      audio.addEventListener("canplay", apply, { once: true });
      return true;
    },
    [duration, manifest],
  );

  const restoreProgress = useCallback(
    (progressPercent: number): boolean => {
      const total =
        duration ||
        resolvePlaybackDuration(0, manifest, manifest.format);
      if (total <= 0) return false;
      return restorePosition((progressPercent / 100) * total);
    },
    [duration, manifest, restorePosition],
  );

  return {
    audioRef,
    audioUrl,
    audioReady,
    audioLoadError,
    playing,
    currentTime,
    duration,
    displayDuration,
    activeSegmentIndex,
    togglePlay,
    jumpToSegment,
    restoreProgress,
    restorePosition,
    segmentOffsets,
  };
}

export function formatPlaybackTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export { resolvePlaybackDuration };
