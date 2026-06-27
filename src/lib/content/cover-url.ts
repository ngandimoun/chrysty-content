export function buildCreationCoverPath(
  creationId: string,
  contentKey: string,
): string {
  return `/api/creations/${creationId}/cover?ck=${encodeURIComponent(contentKey)}`;
}

export function buildCreationAssetPath(
  creationId: string,
  assetId: string,
  contentKey: string,
): string {
  return `/api/creations/${creationId}/assets/${assetId}?ck=${encodeURIComponent(contentKey)}&av=1`;
}
