import { CONTENT_KEY_HEADER } from "./constants";

export function getContentKeyFromCoverRequest(request: Request): string | null {
  const url = new URL(request.url);
  const ck = url.searchParams.get("ck")?.trim();
  if (ck && ck.length >= 8) {
    return ck;
  }

  const header = request.headers.get(CONTENT_KEY_HEADER)?.trim();
  if (header && header.length >= 8) {
    return header;
  }

  return null;
}
