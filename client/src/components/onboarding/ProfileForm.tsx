"use client";

import { useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppForm, fieldErrorMessage } from "@/hooks/useAppForm";
import { profileFormSchema } from "@/lib/validation";
import { FormInput, FormTextarea } from "@/components/forms/FormField";
import FormErrorSummary from "@/components/forms/FormErrorSummary";

interface ProfileFormProps {
  displayName: string;
  bio: string;
  onUpdate: (data: { displayName: string; bio: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

const BIO_LIMIT = 280;

export default function ProfileForm({
  displayName,
  bio,
  onUpdate,
  onNext,
  onBack,
}: ProfileFormProps) {
  const form = useAppForm(profileFormSchema, {
    defaultValues: {
      displayName,
      bio,
    },
  });

  useEffect(() => {
    form.reset({ displayName, bio });
  }, [displayName, bio, form]);

  const watchedDisplayName = form.watch("displayName");
  const watchedBio = form.watch("bio");

  useEffect(() => {
    onUpdate({ displayName: watchedDisplayName, bio: watchedBio });
  }, [onUpdate, watchedDisplayName, watchedBio]);

  const errorSummary = useMemo(
    () => Object.values(form.formState.errors).flatMap((error) => (error?.message ? [String(error.message)] : [])),
    [form.formState.errors],
  );

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Your Profile</CardTitle>
        <CardDescription>Tell others about yourself.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(() => onNext())} className="space-y-4">
          <FormErrorSummary errors={errorSummary} />

          <FormInput
            name="displayName"
            label="Display Name"
            placeholder="e.g. John's Farm"
            register={form.register}
            error={fieldErrorMessage(form.formState.errors, "displayName")}
          />

          <FormTextarea
            name="bio"
            label="Bio (optional)"
            placeholder="Organic tomatoes and peppers from Lagos…"
            rows={3}
            maxLength={BIO_LIMIT}
            register={form.register}
            error={fieldErrorMessage(form.formState.errors, "bio")}
          />
          <p className="text-muted-foreground text-right text-xs">
            {watchedBio.length}/{BIO_LIMIT}
          </p>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button type="submit" className="flex-[2]" disabled={!form.formState.isValid}>
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
