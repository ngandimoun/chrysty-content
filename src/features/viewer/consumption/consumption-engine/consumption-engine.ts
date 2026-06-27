import type {
  ConsumptionEventInput,
  ConsumptionEventType,
  ConsumptionProgressPatch,
} from "@/types/consumption";

import type {
  ConsumptionEngineContext,
  ConsumptionEngineDeps,
  RestoreTarget,
} from "./types";

export class ConsumptionEngine {
  private pendingEvents: ConsumptionEventInput[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private activeSeconds = 0;
  private sessionStart: number | null = null;
  private lastTick: number | null = null;
  private opened = false;
  private restored = false;
  private wasPlaying = false;
  private wasPaused = false;
  private lastSeekTime: number | null = null;
  private completedEmitted = false;
  private lastProgressSaveAt = 0;
  private sessionIncremented = false;

  constructor(private deps: ConsumptionEngineDeps) {}

  private authHeaders() {
    return this.deps.getAuthHeaders?.() ?? {};
  }

  tickActiveTime() {
    const now = Date.now();
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      this.sessionStart !== null &&
      this.lastTick !== null
    ) {
      this.activeSeconds += Math.floor((now - this.lastTick) / 1000);
    }
    this.lastTick = now;
  }

  startSession() {
    this.sessionStart = Date.now();
    this.lastTick = Date.now();
  }

  endSession() {
    this.tickActiveTime();
    this.sessionStart = null;
  }

  emitEvent(
    eventType: ConsumptionEventType,
    payload?: Record<string, unknown>,
    dedupeKey?: string,
  ) {
    if (dedupeKey) {
      const last = this.pendingEvents[this.pendingEvents.length - 1];
      if (
        last?.eventType === eventType &&
        JSON.stringify(last.payload) === JSON.stringify(payload)
      ) {
        return;
      }
    }
    this.pendingEvents.push({ eventType, payload });
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => void this.flushEvents(), 1500);
  }

  async flushEvents() {
    if (this.pendingEvents.length === 0) return;
    const batch = [...this.pendingEvents];
    this.pendingEvents = [];
    try {
      await this.deps.postEvents(
        this.deps.creationId,
        batch,
        this.authHeaders(),
      );
    } catch {
      this.pendingEvents.unshift(...batch);
    }
  }

  computeProgress(ctx: ConsumptionEngineContext): {
    progressPercent: number;
    currentPage?: number;
    currentPositionSeconds?: number;
    playbackSpeed?: number;
    isComplete: boolean;
  } {
    const { adapter } = ctx;

    if (adapter.mode === "book") {
      const progressPercent =
        adapter.sectionsLength > 0
          ? ((adapter.activeSectionIndex + 1) / adapter.sectionsLength) * 100
          : 0;
      return {
        progressPercent,
        currentPage: adapter.activeSectionIndex + 1,
        isComplete:
          adapter.sectionsLength > 0 &&
          adapter.activeSectionIndex >= adapter.sectionsLength - 1,
      };
    }

    const progressPercent =
      adapter.duration > 0
        ? (adapter.currentTime / adapter.duration) * 100
        : 0;
    return {
      progressPercent,
      currentPositionSeconds: adapter.currentTime,
      playbackSpeed: 1,
      isComplete: adapter.duration > 0 && adapter.currentTime >= adapter.duration - 0.5,
    };
  }

  async saveProgress(
    ctx: ConsumptionEngineContext,
    patch: Partial<ConsumptionProgressPatch> = {},
  ) {
    this.tickActiveTime();
    const { adapter } = ctx;

    if (
      adapter.mode !== "book" &&
      adapter.duration <= 0 &&
      patch.consumptionStatus !== "completed"
    ) {
      return;
    }

    const resumeContext = ctx.buildResumeContext();
    const computed = this.computeProgress(ctx);
    const isComplete = computed.isComplete || patch.consumptionStatus === "completed";

    if (isComplete && !this.completedEmitted) {
      this.emitEvent("complete", {
        timeSpentSeconds: this.activeSeconds,
      });
      this.completedEmitted = true;
    }

    const hasAudioProgress =
      adapter.mode !== "book" &&
      adapter.duration > 0 &&
      (computed.currentPositionSeconds ?? 0) > 0;
    const hasBookProgress =
      adapter.mode === "book" && computed.progressPercent > 0;

    let consumptionStatus: ConsumptionProgressPatch["consumptionStatus"];
    if (isComplete) {
      consumptionStatus = "completed";
    } else if (hasAudioProgress || hasBookProgress || this.wasPlaying) {
      consumptionStatus = "in_progress";
    }

    try {
      await this.deps.patchConsumption(
        this.deps.creationId,
        {
          progressPercent: computed.progressPercent,
          currentPage: computed.currentPage,
          currentPositionSeconds: computed.currentPositionSeconds,
          playbackSpeed: computed.playbackSpeed,
          timeSpentDeltaSeconds: this.activeSeconds,
          resumeContext,
          ...(consumptionStatus ? { consumptionStatus } : {}),
          ...patch,
        },
        this.authHeaders(),
      );
      this.activeSeconds = 0;
    } catch {
      // retry on next interval
    }
  }

  handleTimeUpdate(ctx: ConsumptionEngineContext) {
    const { adapter } = ctx;
    if (adapter.mode === "book") return;
    if (!adapter.playing || adapter.duration <= 0) return;

    const now = Date.now();
    if (now - this.lastProgressSaveAt < 5000) return;
    this.lastProgressSaveAt = now;
    void this.saveProgress(ctx);
  }

  open(ctx: ConsumptionEngineContext) {
    if (this.opened) return;
    this.opened = true;
    this.startSession();
    this.emitEvent("open");
  }

  close(ctx: ConsumptionEngineContext) {
    this.endSession();
    this.emitEvent("close", { timeSpentSeconds: this.activeSeconds });
    void this.saveProgress(ctx);
    void this.flushEvents();
  }

  handlePlaybackState(ctx: ConsumptionEngineContext, playing: boolean) {
    if (playing && !this.wasPlaying) {
      this.emitEvent(this.wasPaused ? "resume" : "play");
      this.wasPlaying = true;
      this.wasPaused = false;
      const incrementSession = !this.sessionIncremented;
      this.sessionIncremented = true;
      void this.saveProgress(ctx, incrementSession ? { incrementSession: true } : {});
    } else if (!playing && this.wasPlaying) {
      this.emitEvent("pause");
      this.wasPlaying = false;
      this.wasPaused = true;
    }
  }

  handleSeek(fromSeconds: number, toSeconds: number) {
    if (Math.abs(fromSeconds - toSeconds) < 0.25) return;
    this.emitEvent("seek", { fromSeconds, toSeconds });
    this.lastSeekTime = toSeconds;
  }

  handlePageChange(fromPage: number, toPage: number) {
    if (fromPage === toPage) return;
    this.emitEvent("page_change", { fromPage, toPage });
  }

  bookmark(payload: Record<string, unknown>) {
    this.emitEvent("bookmark", payload);
  }

  highlight(payload: Record<string, unknown>) {
    this.emitEvent("highlight", payload);
  }

  share(payload?: Record<string, unknown>) {
    this.emitEvent("share", payload);
  }

  download(payload?: Record<string, unknown>) {
    this.emitEvent("download", payload);
  }

  archive(payload?: Record<string, unknown>) {
    this.emitEvent("archive", payload);
  }

  tryRestoreBook(
    target: RestoreTarget,
    setSectionIndex: (index: number) => void,
    sectionsLength: number,
  ): boolean {
    if (this.restored) return true;
    if (target.currentPage && target.currentPage > 0) {
      setSectionIndex(Math.min(sectionsLength - 1, target.currentPage - 1));
    }
    this.restored = true;
    return true;
  }

  tryRestoreAudio(
    target: RestoreTarget,
    seek: (seconds: number) => boolean,
    getDuration: () => number,
  ): boolean {
    if (this.restored) return true;
    const duration = getDuration();
    if (duration <= 0) return false;

    const seconds =
      target.currentPositionSeconds ??
      (target.progressPercent / 100) * duration;
    const ok = seek(seconds);
    if (ok) {
      this.restored = true;
    }
    return ok;
  }

  markRestored() {
    this.restored = true;
  }

  isRestored() {
    return this.restored;
  }

  resetForCreation() {
    this.restored = false;
    this.opened = false;
    this.completedEmitted = false;
    this.wasPlaying = false;
    this.wasPaused = false;
    this.activeSeconds = 0;
    this.lastProgressSaveAt = 0;
    this.sessionIncremented = false;
  }

  dispose(ctx: ConsumptionEngineContext) {
    this.endSession();
    void this.saveProgress(ctx);
    void this.flushEvents();
  }
}
