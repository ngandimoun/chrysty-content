import type { CreationManifestResponse } from "@/lib/content/api-client";
import type { Creation } from "@/types/creation";
import type {
  ConsumptionEventInput,
  ConsumptionProgressPatch,
  ResumeContext,
} from "@/types/consumption";

import type { ConsumptionMode } from "../consumption-mode";

export interface ConsumptionEngineDeps {
  creationId: string;
  getAuthHeaders?: () => Record<string, string>;
  patchConsumption: (
    id: string,
    patch: ConsumptionProgressPatch,
    headers?: Record<string, string>,
  ) => Promise<unknown>;
  postEvents: (
    id: string,
    events: ConsumptionEventInput[],
    headers?: Record<string, string>,
  ) => Promise<unknown>;
}

export interface BookAdapterState {
  mode: "book";
  activeSectionIndex: number;
  sectionsLength: number;
  manifest: CreationManifestResponse;
}

export interface AudioAdapterState {
  mode: "audiobook" | "podcast";
  currentTime: number;
  duration: number;
  activeSegmentIndex: number;
  playing: boolean;
  manifest: CreationManifestResponse;
}

export type AdapterState = BookAdapterState | AudioAdapterState;

export interface ConsumptionEngineContext {
  creation: Creation;
  adapter: AdapterState;
  buildResumeContext: () => ResumeContext | undefined;
}

export interface RestoreTarget {
  progressPercent: number;
  currentPage?: number;
  currentPositionSeconds?: number;
  playbackSpeed?: number;
}
