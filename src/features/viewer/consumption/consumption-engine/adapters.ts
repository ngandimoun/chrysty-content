import {
  deriveResumeContextFromAudio,
  deriveResumeContextFromBook,
} from "@/lib/content/resume-context";

import { isAudioMode, type ConsumptionMode } from "../consumption-mode";
import type { CreationManifestResponse } from "@/lib/content/api-client";

import type { AdapterState, ConsumptionEngineContext } from "./types";
import type { Creation } from "@/types/creation";

export function buildBookAdapter(
  manifest: CreationManifestResponse,
  activeSectionIndex: number,
  sectionsLength: number,
): AdapterState {
  return {
    mode: "book",
    activeSectionIndex,
    sectionsLength,
    manifest,
  };
}

export function buildAudioAdapter(
  manifest: CreationManifestResponse,
  mode: ConsumptionMode,
  state: {
    currentTime: number;
    duration: number;
    activeSegmentIndex: number;
    playing: boolean;
  },
): AdapterState {
  return {
    mode: mode === "podcast" ? "podcast" : "audiobook",
    ...state,
    manifest,
  };
}

export function buildEngineContext(
  creation: Creation,
  mode: ConsumptionMode,
  adapter: AdapterState,
): ConsumptionEngineContext {
  return {
    creation,
    adapter,
    buildResumeContext: () => {
      if (adapter.mode === "book" && adapter.manifest.type === "story") {
        return deriveResumeContextFromBook(
          adapter.manifest.manifest,
          adapter.activeSectionIndex,
        );
      }
      if (isAudioMode(mode) && adapter.mode !== "book") {
        return deriveResumeContextFromAudio(
          adapter.manifest.manifest as import("@/types/content-metadata").AudioManifest,
          adapter.activeSegmentIndex,
          adapter.currentTime,
        );
      }
      return undefined;
    },
  };
}
