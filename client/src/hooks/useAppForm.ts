"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type FieldValues, type UseFormProps, type UseFormReturn } from "react-hook-form";
import type { ZodType } from "zod";

export function useAppForm<TFieldValues extends FieldValues>(
  schema: ZodType<TFieldValues>,
  options: Omit<UseFormProps<TFieldValues>, "resolver"> & {
    defaultValues: DefaultValues<TFieldValues>;
  },
): UseFormReturn<TFieldValues> {
  return useForm<TFieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
    ...options,
  });
}

export function fieldErrorMessage<TFieldValues extends FieldValues>(
  errors: UseFormReturn<TFieldValues>["formState"]["errors"],
  name: keyof TFieldValues,
): string | undefined {
  const error = errors[name];
  if (!error) return undefined;
  return "message" in error && typeof error.message === "string"
    ? error.message
    : undefined;
}
