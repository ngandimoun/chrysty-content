"use client";

import type { ReactNode } from "react";
import type { FieldErrors } from "react-hook-form";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CUSTOM_VALUE } from "@/features/creation/creation-options";
import type { RadioOption } from "@/features/creation/creation-options";
import { cn } from "@/lib/utils";

interface WizardStepHeaderProps {
  emoji: string;
  title: string;
  onBack: () => void;
}

export function WizardStepHeader({
  emoji,
  title,
  onBack,
}: WizardStepHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onBack}
        aria-label="Back to category selection"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}

interface FormFieldsetProps {
  legend: string;
  children: ReactNode;
  className?: string;
}

export function FormFieldset({ legend, children, className }: FormFieldsetProps) {
  return (
    <fieldset className={cn("space-y-3", className)}>
      <legend className="text-sm font-medium">{legend}</legend>
      {children}
    </fieldset>
  );
}

interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

interface CustomRadioFieldProps<T extends Record<string, unknown>> {
  legend: string;
  fieldName: keyof T & string;
  customFieldName: keyof T & string;
  options: RadioOption[];
  value: string;
  customValue?: string;
  errors: FieldErrors<T>;
  onValueChange: (value: string) => void;
  onCustomChange: (value: string) => void;
  customPlaceholder?: string;
  idPrefix: string;
}

export function CustomRadioField<T extends Record<string, unknown>>({
  legend,
  fieldName,
  customFieldName,
  options,
  value,
  customValue,
  errors,
  onValueChange,
  onCustomChange,
  customPlaceholder = "Describe your custom option",
  idPrefix,
}: CustomRadioFieldProps<T>) {
  const fieldError = errors[fieldName]?.message as string | undefined;
  const customError = errors[customFieldName]?.message as string | undefined;

  return (
    <FormFieldset legend={legend}>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        className="gap-2"
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={opt.value} id={`${idPrefix}-${opt.value}`} />
            <Label htmlFor={`${idPrefix}-${opt.value}`} className="font-normal">
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {value === CUSTOM_VALUE && (
        <Input
          value={customValue ?? ""}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder={customPlaceholder}
          aria-invalid={!!customError}
          className="mt-1"
        />
      )}
      <FieldError message={fieldError ?? customError} />
    </FormFieldset>
  );
}

interface RadioFieldsetProps {
  legend: string;
  options: RadioOption[];
  value: string;
  error?: string;
  onValueChange: (value: string) => void;
  idPrefix: string;
}

export function RadioFieldset({
  legend,
  options,
  value,
  error,
  onValueChange,
  idPrefix,
}: RadioFieldsetProps) {
  return (
    <FormFieldset legend={legend}>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        className="gap-2"
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={opt.value} id={`${idPrefix}-${opt.value}`} />
            <Label htmlFor={`${idPrefix}-${opt.value}`} className="font-normal">
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <FieldError message={error} />
    </FormFieldset>
  );
}

interface FormSectionProps {
  children: ReactNode;
  showSeparator?: boolean;
}

export function FormSection({ children, showSeparator = true }: FormSectionProps) {
  return (
    <>
      {children}
      {showSeparator && <Separator />}
    </>
  );
}

interface TextAreaFieldProps<T extends Record<string, unknown>> {
  legend: string;
  name: keyof T & string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function TextAreaField<T extends Record<string, unknown>>({
  legend,
  value,
  error,
  placeholder,
  onChange,
}: TextAreaFieldProps<T>) {
  return (
    <FormFieldset legend={legend}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        aria-invalid={!!error}
        className={cn("min-h-[100px] resize-y", error && "border-destructive ring-3 ring-destructive/20")}
      />
      <FieldError message={error} />
    </FormFieldset>
  );
}

interface TextInputFieldProps {
  legend: string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function TextInputField({
  legend,
  value,
  error,
  placeholder,
  onChange,
}: TextInputFieldProps) {
  return (
    <FormFieldset legend={legend}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
      />
      <FieldError message={error} />
    </FormFieldset>
  );
}

export function resolveCustomLabel(
  value: string,
  customValue: string | undefined,
  options: RadioOption[],
): string {
  if (value === CUSTOM_VALUE) {
    return customValue?.trim() || "Custom";
  }
  return options.find((o) => o.value === value)?.label ?? value;
}
