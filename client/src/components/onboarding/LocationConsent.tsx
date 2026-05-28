"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAppForm, fieldErrorMessage } from "@/hooks/useAppForm";
import { locationFormSchema } from "@/lib/validation";
import { FormInput } from "@/components/forms/FormField";
import FormErrorSummary from "@/components/forms/FormErrorSummary";
import { withErrorHandling } from "@/lib/errorHandler";

type LocationState =
  | "idle"
  | "requesting_location"
  | "reverse_geocoding"
  | "success"
  | "error"
  | "manual_fallback";

interface LocationConsentProps {
  onComplete: (
    location: {
      latitude: number;
      longitude: number;
      city: string;
      country: string;
      isPublic: boolean;
    } | null,
  ) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function LocationConsent({
  onComplete,
  onBack,
  isSubmitting,
}: LocationConsentProps) {
  const [state, setState] = useState<LocationState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const form = useAppForm(locationFormSchema, {
    defaultValues: {
      city: "",
      country: "",
      isPublic: true,
    },
  });

  const isPublic = form.watch("isPublic");

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const errorSummary = useMemo(
    () =>
      Object.values(form.formState.errors).flatMap((error) =>
        error?.message ? [String(error.message)] : [],
      ),
    [form.formState.errors],
  );

  async function handleShareLocation() {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      setState("error");
      return;
    }
    setState("requesting_location");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState("reverse_geocoding");

        const { data, error } = await withErrorHandling(async () => {
          abortControllerRef.current = new AbortController();
          const timeoutId = setTimeout(
            () => abortControllerRef.current?.abort(),
            10000,
          );

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { signal: abortControllerRef.current.signal },
          );

          clearTimeout(timeoutId);

          if (!res.ok) {
            throw new Error(`Fetch failed with status ${res.status}`);
          }

          return (await res.json()) as {
            address?: { city?: string; town?: string; village?: string; country?: string };
          };
        }, {
          feature: "LocationConsent",
          action: "reverse_geocode",
        });

        if (error || !data) {
          setErrorMsg(error?.message ?? "Failed to detect city/country automatically");
          setState("error");
          return;
        }

        const detectedCity =
          data.address?.city || data.address?.town || data.address?.village || "";
        const detectedCountry = data.address?.country || "";

        setState("success");
        onComplete({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          city: detectedCity,
          country: detectedCountry,
          isPublic,
        });
      },
      (err) => {
        setErrorMsg(err.message || "Permission denied or location unavailable");
        setState("error");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function handleManualSubmit(values: { city: string; country: string; isPublic: boolean }) {
    onComplete({
      latitude: 0,
      longitude: 0,
      city: values.city.trim(),
      country: values.country.trim(),
      isPublic: values.isPublic,
    });
  }

  if (state === "idle") {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Share Your Location</CardTitle>
          <CardDescription>
            Help buyers and farmers find you nearby.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 border-primary/20 rounded-2xl border p-4">
            <p className="text-sm">
              Share your location so buyers and farmers can find you.{" "}
              <strong>Your exact coordinates are never shown publicly</strong>{" "}
              — only your city and approximate distance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="loc-public"
              checked={isPublic}
              onCheckedChange={(v) =>
                form.setValue("isPublic", Boolean(v), { shouldValidate: true })
              }
            />
            <Label htmlFor="loc-public" className="cursor-pointer">
              Show my location on the map
            </Label>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleShareLocation}
              isLoading={isSubmitting}
              className="w-full"
            >
              <MapPin className="mr-2 size-4" />
              Allow Location Access
            </Button>
            <Button
              variant="outline"
              onClick={() => setState("manual_fallback")}
              className="w-full"
            >
              Enter Manually Instead
            </Button>
            <Button
              variant="ghost"
              onClick={() => onComplete(null)}
              disabled={isSubmitting}
              className="w-full"
            >
              Skip for Now
            </Button>
          </div>

          <Button variant="outline" onClick={onBack} className="w-full">
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (
    state === "requesting_location" ||
    state === "reverse_geocoding" ||
    state === "success"
  ) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Loader2 className="text-primary size-10 animate-spin" />
          <p className="font-medium">
            {state === "requesting_location"
              ? "Detecting your location…"
              : "Processing location data…"}
          </p>
          <p className="text-muted-foreground text-sm">
            {state === "requesting_location"
              ? "Please allow location access in your browser."
              : "Just a moment."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="text-destructive size-10" />
          <div className="space-y-1">
            <p className="font-medium text-destructive">Location Error</p>
            <p className="text-muted-foreground text-sm">{errorMsg}</p>
          </div>
          <div className="flex w-full flex-col gap-2 pt-4">
            <Button onClick={handleShareLocation} className="w-full">
              Retry location detection
            </Button>
            <Button
              variant="outline"
              onClick={() => setState("manual_fallback")}
              className="w-full"
            >
              Enter your location manually
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Enter Your Location</CardTitle>
        <CardDescription>
          We&apos;ll show your approximate area on the map.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(handleManualSubmit)}
          noValidate
        >
          <FormErrorSummary errors={errorSummary} />

          <FormInput
            name="city"
            label="City"
            placeholder="e.g. Lagos"
            register={form.register}
            error={fieldErrorMessage(form.formState.errors, "city")}
          />

          <FormInput
            name="country"
            label="Country"
            placeholder="e.g. Nigeria"
            register={form.register}
            error={fieldErrorMessage(form.formState.errors, "country")}
          />

          <div className="flex items-center gap-3">
            <Checkbox
              id="loc-manual-public"
              checked={isPublic}
              onCheckedChange={(v) =>
                form.setValue("isPublic", Boolean(v), { shouldValidate: true })
              }
            />
            <Label htmlFor="loc-manual-public" className="cursor-pointer">
              Show my location on the map
            </Label>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setState("idle")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-[2]"
              disabled={!form.formState.isValid}
            >
              Save Location
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
