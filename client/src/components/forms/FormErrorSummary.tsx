"use client";

interface FormErrorSummaryProps {
  title?: string;
  errors: string[];
}

export default function FormErrorSummary({
  title = "Please fix the following issues:",
  errors,
}: FormErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
        {errors.map((error, index) => (
          <li key={`${error}-${index}`}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
