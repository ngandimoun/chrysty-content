export const MAX_REFERENCE_FILES = 5;

export const MAX_REFERENCE_FILE_BYTES = 50 * 1024 * 1024;

export const REFERENCE_FILE_ACCEPT = ".pdf,.txt,.md,.doc,.docx";

export const REFERENCE_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const REFERENCE_FILE_EXTENSIONS = new Set([
  ".pdf",
  ".txt",
  ".md",
  ".doc",
  ".docx",
]);

export function isAllowedReferenceFile(file: File): boolean {
  if (REFERENCE_FILE_MIME_TYPES.has(file.type)) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  for (const ext of REFERENCE_FILE_EXTENSIONS) {
    if (lowerName.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateReferenceFiles(files: File[]): string | null {
  if (files.length > MAX_REFERENCE_FILES) {
    return `You can upload up to ${MAX_REFERENCE_FILES} files.`;
  }

  for (const file of files) {
    if (!isAllowedReferenceFile(file)) {
      return `"${file.name}" is not supported. Use PDF, TXT, MD, DOC, or DOCX.`;
    }
    if (file.size > MAX_REFERENCE_FILE_BYTES) {
      return `"${file.name}" exceeds the 50 MB limit.`;
    }
  }

  return null;
}
