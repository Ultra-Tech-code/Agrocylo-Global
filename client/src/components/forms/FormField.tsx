"use client";

import type React from "react";
import type { FieldValues, Path, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BaseFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  error?: string;
  label: string;
}

interface InputFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  type?: React.ComponentProps<typeof Input>["type"];
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
}

export function FormInput<TFieldValues extends FieldValues>({
  name,
  register,
  error,
  label,
  type,
  placeholder,
  hint,
  disabled,
}: InputFieldProps<TFieldValues>) {
  return (
    <Input
      label={label}
      type={type}
      placeholder={placeholder}
      error={error}
      hint={hint}
      disabled={disabled}
      {...register(name)}
    />
  );
}

interface TextareaFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
}

export function FormTextarea<TFieldValues extends FieldValues>({
  name,
  register,
  error,
  label,
  placeholder,
  rows = 3,
  maxLength,
  disabled,
}: TextareaFieldProps<TFieldValues>) {
  const id = `field-${String(name)}`;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register(name)}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  options: Array<{ label: string; value: string }>;
  disabled?: boolean;
}

export function FormSelect<TFieldValues extends FieldValues>({
  name,
  register,
  error,
  label,
  options,
  disabled,
}: SelectFieldProps<TFieldValues>) {
  const id = `field-${String(name)}`;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        disabled={disabled}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register(name)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
