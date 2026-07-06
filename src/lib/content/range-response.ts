export interface ParsedByteRange {
  start: number;
  end: number;
}

export function parseByteRangeHeader(
  rangeHeader: string | null,
  totalSize: number,
): ParsedByteRange | null | "unsatisfiable" {
  if (!rangeHeader?.startsWith("bytes=")) {
    return null;
  }

  const spec = rangeHeader.slice("bytes=".length).trim();
  if (spec.includes(",")) {
    return null;
  }

  const dashIndex = spec.indexOf("-");
  if (dashIndex < 0) {
    return "unsatisfiable";
  }

  const startPart = spec.slice(0, dashIndex).trim();
  const endPart = spec.slice(dashIndex + 1).trim();

  let start: number;
  let end: number;

  if (startPart === "" && endPart !== "") {
    const suffixLength = Number.parseInt(endPart, 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return "unsatisfiable";
    }
    start = Math.max(0, totalSize - suffixLength);
    end = totalSize - 1;
  } else {
    start = Number.parseInt(startPart, 10);
    end = endPart === "" ? totalSize - 1 : Number.parseInt(endPart, 10);

    if (!Number.isFinite(start) || start < 0) {
      return "unsatisfiable";
    }
    if (!Number.isFinite(end) || end < start) {
      return "unsatisfiable";
    }
  }

  if (start >= totalSize) {
    return "unsatisfiable";
  }

  end = Math.min(end, totalSize - 1);

  return { start, end };
}

export function buildRangedBufferResponse(
  buffer: Buffer,
  request: Request,
  headers: Record<string, string>,
): Response {
  const totalSize = buffer.length;
  const baseHeaders: Record<string, string> = {
    ...headers,
    "Accept-Ranges": "bytes",
  };

  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": String(totalSize),
      },
    });
  }

  const parsed = parseByteRangeHeader(request.headers.get("range"), totalSize);

  if (parsed === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes */${totalSize}`,
      },
    });
  }

  if (!parsed) {
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": String(totalSize),
      },
    });
  }

  const { start, end } = parsed;
  const slice = buffer.subarray(start, end + 1);
  const contentLength = end - start + 1;

  return new Response(new Uint8Array(slice), {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Length": String(contentLength),
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
    },
  });
}
