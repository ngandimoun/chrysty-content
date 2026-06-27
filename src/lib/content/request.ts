import { CONTENT_KEY_HEADER } from "./constants";

export function getContentKeyFromRequest(request: Request): string | null {
  const key = request.headers.get(CONTENT_KEY_HEADER)?.trim();
  if (!key || key.length < 8) {
    return null;
  }
  return key;
}
