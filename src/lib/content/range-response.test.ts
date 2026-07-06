import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildRangedBufferResponse,
  parseByteRangeHeader,
} from "@/lib/content/range-response";

describe("parseByteRangeHeader", () => {
  it("returns null when range header is missing", () => {
    assert.equal(parseByteRangeHeader(null, 1000), null);
  });

  it("parses an inclusive byte range", () => {
    assert.deepEqual(parseByteRangeHeader("bytes=0-99", 1000), {
      start: 0,
      end: 99,
    });
  });

  it("parses open-ended ranges to EOF", () => {
    assert.deepEqual(parseByteRangeHeader("bytes=500-", 1000), {
      start: 500,
      end: 999,
    });
  });

  it("parses suffix ranges", () => {
    assert.deepEqual(parseByteRangeHeader("bytes=-100", 1000), {
      start: 900,
      end: 999,
    });
  });

  it("clamps end to file size", () => {
    assert.deepEqual(parseByteRangeHeader("bytes=950-2000", 1000), {
      start: 950,
      end: 999,
    });
  });

  it("returns unsatisfiable for out-of-bounds start", () => {
    assert.equal(parseByteRangeHeader("bytes=1000-1100", 1000), "unsatisfiable");
  });
});

describe("buildRangedBufferResponse", () => {
  const buffer = Buffer.from("0123456789");

  it("returns full body for requests without range", async () => {
    const response = buildRangedBufferResponse(
      buffer,
      new Request("https://example.com/audio"),
      { "Content-Type": "audio/wav" },
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Accept-Ranges"), "bytes");
    assert.equal(response.headers.get("Content-Length"), "10");
    assert.equal(await response.text(), "0123456789");
  });

  it("returns partial content for range requests", async () => {
    const response = buildRangedBufferResponse(
      buffer,
      new Request("https://example.com/audio", {
        headers: { Range: "bytes=2-5" },
      }),
      { "Content-Type": "audio/wav" },
    );

    assert.equal(response.status, 206);
    assert.equal(response.headers.get("Content-Range"), "bytes 2-5/10");
    assert.equal(response.headers.get("Content-Length"), "4");
    assert.equal(await response.text(), "2345");
  });

  it("returns headers only for HEAD requests", async () => {
    const response = buildRangedBufferResponse(
      buffer,
      new Request("https://example.com/audio", { method: "HEAD" }),
      { "Content-Type": "audio/wav" },
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Length"), "10");
    assert.equal(await response.text(), "");
  });

  it("returns 416 for unsatisfiable ranges", async () => {
    const response = buildRangedBufferResponse(
      buffer,
      new Request("https://example.com/audio", {
        headers: { Range: "bytes=20-30" },
      }),
      { "Content-Type": "audio/wav" },
    );

    assert.equal(response.status, 416);
    assert.equal(response.headers.get("Content-Range"), "bytes */10");
  });
});
