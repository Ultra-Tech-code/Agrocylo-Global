"use client";

import { useEffect, useMemo, useState } from "react";
import { Upload, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type {
  Product,
  ProductCategory,
  ProductCurrency,
  ProductUnit,
} from "@/types/product";
import {
  normalizeProductWriteInput,
  createProduct,
  updateProduct,
  uploadProductImage,
} from "@/services/productService";
import { isTestMode } from "@/lib/testMode";
import { useAppForm, fieldErrorMessage } from "@/hooks/useAppForm";
import { productFormSchema } from "@/lib/validation";
import { FormInput, FormSelect, FormTextarea } from "@/components/forms/FormField";
import FormErrorSummary from "@/components/forms/FormErrorSummary";
import { withErrorHandling } from "@/lib/errorHandler";

type Mode = "add" | "edit";

const CATEGORIES: ProductCategory[] = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Tubers",
  "Livestock",
  "Other",
];
const CURRENCIES: ProductCurrency[] = ["STRK", "USDC"];
const UNITS: ProductUnit[] = ["kg", "bag", "crate", "piece", "litre", "dozen"];
const MAX_IMAGES = 8;

interface ProductFormModalProps {
  open: boolean;
  mode: Mode;
  walletAddress: string;
  initialProduct?: Product | null;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export default function ProductFormModal({
  open,
  mode,
  walletAddress,
  initialProduct,
  onClose,
  onSuccess,
}: ProductFormModalProps) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useAppForm(productFormSchema, {
    defaultValues: {
      name: "",
      category: "Vegetables",
      pricePerUnit: 0,
      currency: "STRK",
      unit: "kg",
      stockQuantity: "",
      description: "",
      location: "",
      deliveryWindow: "",
      isAvailable: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    setSaveError(null);
    setImageFiles([]);

    form.reset({
      name: initialProduct?.name ?? "",
      category: (initialProduct?.category as ProductCategory) ?? "Vegetables",
      pricePerUnit: Number(initialProduct?.price_per_unit ?? 0),
      currency: (initialProduct?.currency as ProductCurrency) ?? "STRK",
      unit: (initialProduct?.unit as ProductUnit) ?? "kg",
      stockQuantity: initialProduct?.stock_quantity ?? "",
      description: initialProduct?.description ?? "",
      location: initialProduct?.location ?? "",
      deliveryWindow: initialProduct?.delivery_window ?? "",
      isAvailable: initialProduct?.is_available ?? true,
    });
  }, [open, initialProduct, form]);

  const errorSummary = useMemo(
    () =>
      Object.values(form.formState.errors).flatMap((error) =>
        error?.message ? [String(error.message)] : [],
      ),
    [form.formState.errors],
  );

  function handleFileChange(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files);
    if (imageFiles.length + next.length > MAX_IMAGES) {
      setSaveError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    setImageFiles((prev) => [...prev, ...next]);
  }

  async function submit(values: {
    name: string;
    category: ProductCategory;
    pricePerUnit: number;
    currency: ProductCurrency;
    unit: ProductUnit;
    stockQuantity?: string;
    description?: string;
    location: string;
    deliveryWindow: string;
    isAvailable: boolean;
  }) {
    setSaving(true);
    setSaveError(null);

    const payload = normalizeProductWriteInput({
      name: values.name.trim(),
      category: values.category,
      pricePerUnit: String(values.pricePerUnit),
      currency: values.currency,
      unit: values.unit,
      stockQuantity: values.stockQuantity?.trim() || null,
      description: values.description?.trim() || null,
      isAvailable: values.isAvailable,
      location: isTestMode() ? values.location.trim() || "Test Location" : values.location.trim(),
      deliveryWindow:
        isTestMode() ? values.deliveryWindow.trim() || "Test Window" : values.deliveryWindow.trim(),
    });

    const { data: product, error } = await withErrorHandling(async () => {
      const savedProduct =
        mode === "add"
          ? await createProduct(walletAddress, payload)
          : await updateProduct(walletAddress, initialProduct!.id, payload);

      if (imageFiles.length > 0) {
        await Promise.all(
          imageFiles.map((file) =>
            uploadProductImage(walletAddress, savedProduct.id, file),
          ),
        );
      }

      return savedProduct;
    }, {
      form: "ProductFormModal",
      action: mode,
      walletAddress,
    });

    if (!product || error) {
      setSaveError(error?.message ?? "Failed to save.");
      setSaving(false);
      return;
    }

    await onSuccess();
    onClose();
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Product" : "Edit Listing"}
          </DialogTitle>
          <DialogDescription>
            Listings on AgroCylo can be priced in STRK or USDC and are settled by
            the Soroban escrow when a buyer confirms receipt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
          <FormErrorSummary errors={errorSummary} />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              name="name"
              label="Product Name"
              register={form.register}
              error={fieldErrorMessage(form.formState.errors, "name")}
            />
            <FormSelect
              name="category"
              label="Category"
              register={form.register}
              error={fieldErrorMessage(form.formState.errors, "category")}
              options={CATEGORIES.map((category) => ({
                label: category,
                value: category,
              }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput
              name="pricePerUnit"
              label="Price"
              type="number"
              register={form.register}
              error={fieldErrorMessage(form.formState.errors, "pricePerUnit")}
            />
            <FormSelect
              name="currency"
              label="Currency"
              register={form.register}
              error={fieldErrorMessage(form.formState.errors, "currency")}
              options={CURRENCIES.map((currency) => ({
                label: currency,
                value: currency,
              }))}
            />
            <FormSelect
              name="unit"
              label="Unit"
              register={form.register}
              error={fieldErrorMessage(form.formState.errors, "unit")}
              options={UNITS.map((unit) => ({
                label: unit,
                value: unit,
              }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr] sm:items-end">
            <FormInput
              name="stockQuantity"
              label="Stock quantity"
              hint="Leave blank for unlimited."
              type="number"
              register={form.register}
              error={fieldErrorMessage(form.formState.errors, "stockQuantity")}
            />
            <div className="bg-secondary/40 flex h-12 items-center justify-between gap-3 rounded-md border px-4">
              <Label htmlFor="prod-available" className="cursor-pointer">
                Listed
              </Label>
              <Switch
                id="prod-available"
                checked={form.watch("isAvailable")}
                onCheckedChange={(value) =>
                  form.setValue("isAvailable", value, { shouldValidate: true })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              name="location"
              label="Farm Location (Region)"
              placeholder="e.g. Kumasi, Ghana"
              register={form.register}
              error={fieldErrorMessage(form.formState.errors, "location")}
            />
            <FormInput
              name="deliveryWindow"
              label="Delivery Window"
              placeholder="e.g. 2-3 days"
              register={form.register}
              error={fieldErrorMessage(form.formState.errors, "deliveryWindow")}
            />
          </div>

          <FormTextarea
            name="description"
            label="Description & Health Benefits"
            rows={4}
            register={form.register}
            placeholder="Tell buyers about origin, organic status, or health benefits..."
            error={fieldErrorMessage(form.formState.errors, "description")}
          />

          <div className="grid gap-2">
            <Label>Product images</Label>
            <p className="text-muted-foreground text-xs">
              Up to {MAX_IMAGES} images. First image is the cover.
            </p>
            <label
              htmlFor="prod-image-upload"
              className="bg-secondary/40 hover:bg-secondary border-border hover:border-primary/40 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors"
            >
              <div className="bg-background grid size-10 place-content-center rounded-full border">
                <Upload className="text-muted-foreground size-4" />
              </div>
              <p className="text-sm font-medium">Click or drop images here</p>
              <p className="text-muted-foreground text-xs">
                PNG / JPG / WEBP · up to 2 MB each
              </p>
              <input
                id="prod-image-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files)}
              />
            </label>

            {imageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {imageFiles.map((file, index) => (
                  <span
                    key={`${file.name}-${index}`}
                    className="bg-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                  >
                    {file.name}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setImageFiles((prev) =>
                          prev.filter((_, idx) => idx !== index),
                        )
                      }
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {saveError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {saveError}
            </div>
          )}

          <Separator />

          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={saving}
              disabled={saving || !form.formState.isValid}
            >
              {mode === "add" ? "List Product" : "Update Listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
