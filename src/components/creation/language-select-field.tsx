"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { FieldError, FormFieldset } from "@/components/creation/form-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getLanguageLabel,
  SUPPORTED_LANGUAGES,
} from "@/features/creation/supported-languages";
import { cn } from "@/lib/utils";

interface LanguageSelectFieldProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function LanguageSelectField({
  value,
  error,
  onChange,
}: LanguageSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredLanguages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return SUPPORTED_LANGUAGES;
    }

    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.label.toLowerCase().includes(normalizedQuery) ||
        lang.code.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const selectedLabel = value ? getLanguageLabel(value) : "Select a language";

  const handleSelect = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
  };

  return (
    <FormFieldset legend="Language">
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
          }
        }}
      >
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              aria-invalid={!!error}
              className={cn(
                "h-9 w-full justify-between font-normal",
                !value && "text-muted-foreground",
                error && "border-destructive ring-3 ring-destructive/20",
              )}
            />
          }
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>

        <PopoverContent className="w-(--anchor-width) p-0" align="start">
          <div className="border-b p-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search languages..."
              aria-label="Search languages"
              autoFocus
            />
          </div>

          <ScrollArea className="h-56">
            {filteredLanguages.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No languages found
              </p>
            ) : (
              <ul className="p-1" role="listbox" aria-label="Languages">
                {filteredLanguages.map((lang) => {
                  const isSelected = lang.code === value;

                  return (
                    <li key={lang.code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(lang.code)}
                        className={cn(
                          "flex w-full rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                          isSelected && "bg-accent text-accent-foreground",
                        )}
                      >
                        {lang.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <FieldError message={error} />
    </FormFieldset>
  );
}
