export function getFirstName(
  fullName: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const trimmed = fullName?.trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0] ?? null;
  }

  if (email) {
    const local = email.split("@")[0]?.trim();
    return local || null;
  }

  return null;
}
