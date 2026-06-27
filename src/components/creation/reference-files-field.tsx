"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError, FormFieldset } from "@/components/creation/form-primitives";
import {
  formatFileSize,
  MAX_REFERENCE_FILES,
  REFERENCE_FILE_ACCEPT,
  validateReferenceFiles,
} from "@/features/creation/reference-files";
import { cn } from "@/lib/utils";

interface ReferenceFilesFieldProps {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
}

export function ReferenceFilesField({
  files,
  onChange,
  error,
}: ReferenceFilesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const next = [...files, ...Array.from(incoming)];
      const validationError = validateReferenceFiles(next);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
      setLocalError(null);
      onChange(next);
    },
    [files, onChange],
  );

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setLocalError(null);
    onChange(next);
  };

  const displayError = error ?? localError ?? undefined;
  const atLimit = files.length >= MAX_REFERENCE_FILES;

  return (
    <FormFieldset legend="Reference files (optional)">
      <p className="text-muted-foreground text-sm">
        Upload notes, PDFs, or documents to guide generation. PDFs work best for
        charts and layouts.
      </p>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!atLimit) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!atLimit) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!atLimit && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => {
          if (!atLimit) inputRef.current?.click();
        }}
        className={cn(
          "border-border flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
          dragOver && "border-primary bg-primary/5",
          atLimit && "cursor-not-allowed opacity-60",
        )}
      >
        <Upload className="text-muted-foreground size-5" aria-hidden />
        <span className="text-sm font-medium">
          {atLimit
            ? `Maximum ${MAX_REFERENCE_FILES} files reached`
            : "Drop files here or click to browse"}
        </span>
        <span className="text-muted-foreground text-xs">
          PDF, TXT, MD, DOC, DOCX — up to {MAX_REFERENCE_FILES} files, 50 MB each
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={REFERENCE_FILE_ACCEPT}
        multiple
        className="sr-only"
        disabled={atLimit}
        onChange={(e) => {
          if (e.target.files?.length) {
            addFiles(e.target.files);
          }
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="bg-muted/50 flex items-center gap-2 rounded-md px-3 py-2"
            >
              <FileText className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {formatFileSize(file.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${file.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <FieldError message={displayError} />
    </FormFieldset>
  );
}
