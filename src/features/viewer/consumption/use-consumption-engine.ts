"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import type { CreationManifestResponse } from "@/lib/content/api-client";
import {
  patchConsumptionViaApi,
  postConsumptionEventsViaApi,
} from "@/lib/content/api-client";
import type { Creation } from "@/types/creation";
import type {
  ConsumptionProgressPatch,
  ConsumptionSnapshot,
} from "@/types/consumption";

import { isAudioMode, type ConsumptionMode } from "./consumption-mode";
import {
  buildAudioAdapter,
  buildBookAdapter,
  buildEngineContext,
} from "./consumption-engine/adapters";
import { ConsumptionEngine } from "./consumption-engine/consumption-engine";

interface AudioPlaybackSlice {
  currentTime: number;
  duration: number;
  playing: boolean;
  audioReady: boolean;
  activeSegmentIndex: number;
  restoreProgress: (percent: number) => boolean;
  restorePosition: (seconds: number) => boolean;
}

interface UseConsumptionEngineOptions {
  creation: Creation;
  manifest: CreationManifestResponse;
  mode: ConsumptionMode;
  sectionsLength: number;
  activeSectionIndex: number;
  setActiveSectionIndex: (index: number) => void;
  playback?: AudioPlaybackSlice;
  bindSeek?: React.MutableRefObject<(from: number, to: number) => void>;
}

export function useConsumptionEngine(options: UseConsumptionEngineOptions) {
  const {
    creation,
    manifest,
    mode,
    sectionsLength,
    activeSectionIndex,
    setActiveSectionIndex,
    playback,
    bindSeek,
  } = options;

  const auth = useOptionalAuth();
  const queryClient = useQueryClient();
  const getAuthHeadersRef = useRef(auth?.getAuthHeaders);
  getAuthHeadersRef.current = auth?.getAuthHeaders;

  const lastPageRef = useRef(activeSectionIndex);
  const bookCompletedRef = useRef(false);
  const restoreDoneRef = useRef(false);
  const restorePositionRef = useRef(playback?.restorePosition);
  restorePositionRef.current = playback?.restorePosition;

  const patchConsumption = useCallback(
    async (
      id: string,
      patch: ConsumptionProgressPatch,
      headers?: Record<string, string>,
    ) => {
      const snapshot = await patchConsumptionViaApi(id, patch, headers);
      queryClient.setQueryData<Creation>(["creation", id], (old) =>
        old ? { ...old, consumption: snapshot as ConsumptionSnapshot } : old,
      );
      return snapshot;
    },
    [queryClient],
  );

  const engine = useMemo(
    () =>
      new ConsumptionEngine({
        creationId: creation.id,
        getAuthHeaders: () => getAuthHeadersRef.current?.() ?? {},
        patchConsumption,
        postEvents: postConsumptionEventsViaApi,
      }),
    [creation.id, patchConsumption],
  );

  const engineRef = useRef(engine);
  engineRef.current = engine;

  const adapter = useMemo(() => {
    if (mode === "book") {
      return buildBookAdapter(manifest, activeSectionIndex, sectionsLength);
    }
    return buildAudioAdapter(manifest, mode, {
      currentTime: playback?.currentTime ?? 0,
      duration: playback?.duration ?? 0,
      activeSegmentIndex: playback?.activeSegmentIndex ?? activeSectionIndex,
      playing: playback?.playing ?? false,
    });
  }, [
    activeSectionIndex,
    manifest,
    mode,
    playback?.activeSegmentIndex,
    playback?.currentTime,
    playback?.duration,
    playback?.playing,
    sectionsLength,
  ]);

  const ctx = useMemo(
    () => buildEngineContext(creation, mode, adapter),
    [adapter, creation, mode],
  );

  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const saveProgress = useCallback(
    (patch?: Parameters<ConsumptionEngine["saveProgress"]>[1]) =>
      engineRef.current.saveProgress(ctxRef.current, patch),
    [],
  );

  const emitBookmark = useCallback(
    (payload: Record<string, unknown>) => engineRef.current.bookmark(payload),
    [],
  );

  const emitHighlight = useCallback(
    (payload: Record<string, unknown>) => engineRef.current.highlight(payload),
    [],
  );

  useEffect(() => {
    engineRef.current.resetForCreation();
    bookCompletedRef.current = false;
    restoreDoneRef.current = false;
    lastPageRef.current = 0;
  }, [creation.id]);

  useEffect(() => {
    engineRef.current.open(ctxRef.current);
  }, [creation.id]);

  useEffect(() => {
    if (restoreDoneRef.current) return;

    const eng = engineRef.current;
    const consumption = creation.consumption;

    if (!consumption || consumption.progressPercent <= 0) {
      restoreDoneRef.current = true;
      eng.markRestored();
      return;
    }

    if (mode === "book") {
      eng.tryRestoreBook(
        {
          progressPercent: consumption.progressPercent,
          currentPage: consumption.currentPage,
        },
        setActiveSectionIndex,
        sectionsLength,
      );
      restoreDoneRef.current = true;
      return;
    }

    if (!isAudioMode(mode) || !playback) return;
    if (!playback.audioReady || playback.duration <= 0) return;

    const isCompleted = consumption.status === "completed";
    const restoreTarget = isCompleted
      ? { progressPercent: 0, currentPositionSeconds: 0 }
      : {
          progressPercent: consumption.progressPercent,
          currentPositionSeconds: consumption.currentPositionSeconds,
        };

    const seek = restorePositionRef.current;
    if (!seek) return;

    const restored = eng.tryRestoreAudio(
      restoreTarget,
      seek,
      () => playback.duration,
    );

    if (restored) {
      restoreDoneRef.current = true;
      if (isCompleted) {
        bookCompletedRef.current = false;
        void saveProgress({
          consumptionStatus: "in_progress",
          currentPositionSeconds: 0,
          progressPercent: 0,
        });
      }
    }
  }, [
    creation.consumption?.currentPositionSeconds,
    creation.consumption?.progressPercent,
    creation.consumption?.status,
    creation.id,
    mode,
    playback?.audioReady,
    playback?.duration,
    sectionsLength,
    setActiveSectionIndex,
    saveProgress,
  ]);

  useEffect(() => {
    if (!playback || !isAudioMode(mode)) return;
    if (activeSectionIndex !== playback.activeSegmentIndex) {
      setActiveSectionIndex(playback.activeSegmentIndex);
    }
  }, [
    activeSectionIndex,
    mode,
    playback?.activeSegmentIndex,
    setActiveSectionIndex,
  ]);

  useEffect(() => {
    if (mode !== "book") return;
    if (lastPageRef.current === activeSectionIndex) return;
    engineRef.current.handlePageChange(
      lastPageRef.current + 1,
      activeSectionIndex + 1,
    );
    lastPageRef.current = activeSectionIndex;

    if (
      sectionsLength > 0 &&
      activeSectionIndex >= sectionsLength - 1 &&
      !bookCompletedRef.current
    ) {
      bookCompletedRef.current = true;
      void saveProgress({ consumptionStatus: "completed" });
    }
  }, [activeSectionIndex, mode, saveProgress, sectionsLength]);

  useEffect(() => {
    if (!bindSeek) return;
    bindSeek.current = (from, to) => engineRef.current.handleSeek(from, to);
  }, [bindSeek, creation.id]);

  useEffect(() => {
    if (!playback || !isAudioMode(mode)) return;
    engineRef.current.handlePlaybackState(ctxRef.current, playback.playing);
  }, [mode, playback?.playing]);

  useEffect(() => {
    if (!playback || !isAudioMode(mode)) return;
    if (!playback.playing || playback.duration <= 0) return;
    engineRef.current.handleTimeUpdate(ctxRef.current);
  }, [
    mode,
    playback?.playing,
    playback?.currentTime,
    playback?.duration,
  ]);

  useEffect(() => {
    if (!playback || !isAudioMode(mode)) return;
    if (
      playback.duration > 0 &&
      playback.playing &&
      playback.currentTime >= playback.duration - 0.5 &&
      !bookCompletedRef.current
    ) {
      bookCompletedRef.current = true;
      void saveProgress({ consumptionStatus: "completed" });
    }
  }, [
    mode,
    playback?.playing,
    playback?.currentTime,
    playback?.duration,
    saveProgress,
  ]);

  useEffect(() => {
    const eng = engineRef.current;
    eng.startSession();

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        eng.close(ctxRef.current);
      } else {
        eng.startSession();
        eng.emitEvent("open");
      }
    };

    const onPageHide = () => {
      eng.close(ctxRef.current);
    };

    const interval = setInterval(() => {
      eng.tickActiveTime();
      void eng.saveProgress(ctxRef.current);
    }, 15000);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
      eng.dispose(ctxRef.current);
    };
  }, [creation.id]);

  return {
    saveProgress,
    emitBookmark,
    emitHighlight,
    engine: engineRef,
  };
}
