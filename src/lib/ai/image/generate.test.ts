import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  collectImageDiagnostics,
  extractImageFromResponse,
  formatEmptyImageError,
} from "./generate";

const SAMPLE_IMAGE_DATA = Buffer.from("fake-png").toString("base64");

describe("extractImageFromResponse", () => {
  it("skips thought parts and returns the final non-thought image", () => {
    const response = {
      candidates: [
        {
          content: {
            parts: [
              {
                thought: true,
                inlineData: { data: SAMPLE_IMAGE_DATA, mimeType: "image/png" },
              },
              {
                inlineData: { data: SAMPLE_IMAGE_DATA, mimeType: "image/jpeg" },
              },
            ],
          },
        },
      ],
    };

    const image = extractImageFromResponse(response);
    assert.ok(image);
    assert.equal(image.mimeType, "image/jpeg");
  });

  it("scans all candidates and prefers the last non-thought image", () => {
    const response = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: { data: SAMPLE_IMAGE_DATA, mimeType: "image/png" },
              },
            ],
          },
        },
        {
          content: {
            parts: [
              {
                inlineData: { data: SAMPLE_IMAGE_DATA, mimeType: "image/webp" },
              },
            ],
          },
        },
      ],
    };

    const image = extractImageFromResponse(response);
    assert.ok(image);
    assert.equal(image.mimeType, "image/webp");
  });

  it("returns null when only text is returned", () => {
    const response = {
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [{ text: "I cannot generate that image." }],
          },
        },
      ],
    };

    assert.equal(extractImageFromResponse(response), null);

    const diagnostics = collectImageDiagnostics(response);
    assert.deepEqual(diagnostics.finishReasons, ["STOP"]);
    assert.equal(diagnostics.textSnippets[0], "I cannot generate that image.");

    const message = formatEmptyImageError("Image model", diagnostics);
    assert.match(message, /no image data/);
    assert.match(message, /I cannot generate that image/);
  });

  it("includes block reason in diagnostics", () => {
    const response = {
      promptFeedback: {
        blockReason: "SAFETY",
        blockReasonMessage: "Blocked due to safety",
      },
      candidates: [],
    };

    const diagnostics = collectImageDiagnostics(response);
    assert.equal(diagnostics.blockReason, "Blocked due to safety");
  });
});
