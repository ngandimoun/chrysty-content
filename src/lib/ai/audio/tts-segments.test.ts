import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildSegmentTranscriptMap,
  guardSegmentTranscript,
  resolveTtsSegments,
  splitTranscriptAcrossSegments,
  transcriptForSegment,
} from "@/lib/ai/audio/tts-segments";
import type { AudioDirection, AudioPlan } from "@/types/content-metadata";

function makePlan(overrides: Partial<AudioPlan> = {}): AudioPlan {
  return {
    title: "Test Episode",
    format: "podcast",
    targetDurationMinutes: 10,
    estimatedWordCount: 1500,
    language: "en",
    mode: "single_speaker",
    speakers: [
      {
        name: "Host",
        voice: "Kore",
        role: "host",
        audioProfile: "Warm host",
      },
    ],
    ...overrides,
  };
}

function makeDirection(overrides: Partial<AudioDirection> = {}): AudioDirection {
  return {
    mode: "single_speaker",
    targetDurationMinutes: 10,
    estimatedWordCount: 1500,
    language: "en",
    speakers: [
      {
        name: "Host",
        voice: "Kore",
        role: "host",
        audioProfile: "Warm host",
      },
    ],
    ttsPrompt: "# AUDIO PROFILE\nHost",
    transcript: [
      "Host: Line one of the episode.",
      "Host: Line two continues the story.",
      "Host: Line three adds more detail.",
      "Host: Line four develops the topic.",
      "Host: Line five reaches the middle.",
      "Host: Line six keeps moving forward.",
      "Host: Line seven approaches the end.",
      "Host: Line eight wraps up.",
    ].join("\n"),
    ...overrides,
  };
}

describe("splitTranscriptAcrossSegments", () => {
  it("splits lines into non-overlapping slices", () => {
    const transcript = "A\nB\nC\nD\nE\nF\nG\nH";
    const slices = splitTranscriptAcrossSegments(transcript, 4);

    assert.equal(slices.length, 4);
    assert.equal(slices.join("|"), "A\nB|C\nD|E\nF|G\nH");
  });
});

describe("resolveTtsSegments", () => {
  it("uses director excerpts keyed by segmentId", () => {
    const plan = makePlan({
      segments: [
        {
          segmentId: "intro",
          speakerNames: ["Host"],
          estimatedDurationMinutes: 2,
          summary: "Intro",
        },
        {
          segmentId: "body",
          speakerNames: ["Host"],
          estimatedDurationMinutes: 3,
          summary: "Body",
        },
      ],
    });
    const direction = makeDirection({
      segments: [
        {
          segmentId: "intro",
          speakerNames: ["Host"],
          estimatedDurationMinutes: 2,
          transcriptExcerpt: "Host: Line one of the episode.\nHost: Line two continues the story.",
        },
        {
          segmentId: "body",
          speakerNames: ["Host"],
          estimatedDurationMinutes: 3,
          transcriptExcerpt: "Host: Line seven approaches the end.\nHost: Line eight wraps up.",
        },
      ],
    });

    const resolved = resolveTtsSegments(plan, direction);

    assert.equal(resolved.length, 2);
    assert.match(resolved[0]!.transcriptExcerpt ?? "", /Line one/);
    assert.match(resolved[1]!.transcriptExcerpt ?? "", /Line eight/);
  });

  it("falls back to proportional slices when excerpts are missing", () => {
    const plan = makePlan({
      segments: [
        {
          segmentId: "intro",
          speakerNames: ["Host"],
          estimatedDurationMinutes: 2,
          summary: "Intro",
        },
        {
          segmentId: "middle",
          speakerNames: ["Host"],
          estimatedDurationMinutes: 3,
          summary: "Middle",
        },
        {
          segmentId: "outro",
          speakerNames: ["Host"],
          estimatedDurationMinutes: 2,
          summary: "Outro",
        },
        {
          segmentId: "closing",
          speakerNames: ["Host"],
          estimatedDurationMinutes: 2,
          summary: "Closing",
        },
      ],
    });
    const direction = makeDirection({ segments: undefined });

    const resolved = resolveTtsSegments(plan, direction);
    const combined = resolved.map((segment) => segment.transcriptExcerpt ?? "").join("\n");

    assert.equal(resolved.length, 4);
    assert.match(resolved[0]!.transcriptExcerpt ?? "", /Line one/);
    assert.match(resolved[3]!.transcriptExcerpt ?? "", /Line eight/);
    assert.equal(combined.split("Line one").length - 1, 1);
  });
});

describe("transcriptForSegment", () => {
  it("does not return the full script for later multi-segment parts", () => {
    const direction = makeDirection();
    const segments = resolveTtsSegments(
      makePlan({
        segments: [
          {
            segmentId: "seg_a",
            speakerNames: ["Host"],
            estimatedDurationMinutes: 2,
            summary: "A",
          },
          {
            segmentId: "seg_b",
            speakerNames: ["Host"],
            estimatedDurationMinutes: 2,
            summary: "B",
          },
          {
            segmentId: "seg_c",
            speakerNames: ["Host"],
            estimatedDurationMinutes: 2,
            summary: "C",
          },
        ],
      }),
      direction,
    );
    const slices = splitTranscriptAcrossSegments(direction.transcript, segments.length);

    const lastTranscript = transcriptForSegment(direction, segments[2]!, undefined, {
      totalSegments: segments.length,
      segmentIndex: 2,
      proportionalSlices: slices,
    });

    assert.ok(!lastTranscript.includes("Line one of the episode"));
    assert.match(lastTranscript, /Line seven|Line eight/);
  });
});

describe("buildSegmentTranscriptMap", () => {
  it("returns one stable entry per segment", () => {
    const plan = makePlan({
      segments: [
        {
          segmentId: "intro",
          speakerNames: ["Host"],
          estimatedDurationMinutes: 2,
          summary: "Intro",
        },
        {
          segmentId: "outro",
          speakerNames: ["Host"],
          estimatedDurationMinutes: 2,
          summary: "Outro",
        },
      ],
    });
    const direction = makeDirection();

    const map = buildSegmentTranscriptMap(plan, direction);

    assert.equal(Object.keys(map).length, 2);
    assert.ok(map.intro?.includes("Line one"));
    assert.ok(map.outro?.includes("Line eight"));
  });
});

describe("guardSegmentTranscript", () => {
  it("slices when segment text matches nearly the full script", () => {
    const fullTranscript = makeDirection().transcript;
    const guarded = guardSegmentTranscript({
      segmentTranscript: fullTranscript,
      segmentId: "seg_03",
      segmentIndex: 2,
      totalSegments: 4,
      fullTranscript,
    });

    assert.notEqual(guarded, fullTranscript);
    assert.ok(guarded.length < fullTranscript.length);
  });
});
