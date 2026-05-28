"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type {
  ProductCategory,
  ProductCurrency,
  ProductUnit,
} from "@/types/product";
import type { BarterOfferItem } from "@/types/barter";
import { useAppForm, fieldErrorMessage } from "@/hooks/useAppForm";
import { barterOfferSchema, type BarterOfferFormValues } from "@/lib/validation";
import { FormInput, FormSelect, FormTextarea } from "@/components/forms/FormField";
import FormErrorSummary from "@/components/forms/FormErrorSummary";
import { withErrorHandling } from "@/lib/errorHandler";

const CATEGORIES: ProductCategory[] = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Tubers",
  "Livestock",
  "Other",
];
const UNITS: ProductUnit[] = ["kg", "bag", "crate", "piece", "litre", "dozen"];
const CURRENCIES: ProductCurrency[] = ["STRK", "USDC"];
const EXPIRY_OPTIONS = [
  { label: "12 hours", value: 12 },
  { label: "24 hours", value: 24 },
  { label: "48 hours", value: 48 },
  { label: "72 hours", value: 72 },
  { label: "7 days", value: 168 },
];

function emptyItem(): BarterOfferItem {
  return {
    product_name: "",
    category: "Vegetables",
    quantity: "",
    unit: "kg",
  };
}

function BarterItemSection({
  title,
  accent,
  prefix,
  register,
  fields,
  remove,
  append,
  errors,
}: {
  title: string;
  accent: "primary" | "amber";
  prefix: "offerItems" | "requestItems";
  register: ReturnType<typeof useAppForm<typeof barterOfferSchema>>["register"];
  fields: Array<{ id: string }>;
  remove: (index: number) => void;
  append: (value: BarterOfferItem) => void;
  errors?: string;
}) {
  const borderClass =
    accent === "primary" ? "border-l-primary" : "border-l-amber-500";

  return (
    <div className={`space-y-3 border-l-4 ${borderClass} pl-4`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(emptyItem())}
        >
          <Plus className="size-3.5" />
          Add item
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="bg-secondary/30 space-y-3 rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium">Item {index + 1}</p>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-destructive inline-flex items-center gap-1 text-xs hover:text-destructive/80"
                >
                  <Trash2 className="size-3" />
                  Remove
                </button>
              )}
            </div>

            <FormInput
              name={`${prefix}.${index}.product_name`}
              label="Product name"
              register={register}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormSelect
                name={`${prefix}.${index}.category`}
                label="Category"
                register={register}
                options={CATEGORIES.map((category) => ({
                  label: category,
                  value: category,
                }))}
              />

              <FormInput
                name={`${prefix}.${index}.quantity`}
                label="Quantity"
                type="number"
                register={register}
              />

              <FormSelect
                name={`${prefix}.${index}.unit`}
                label="Unit"
                register={register}
                options={UNITS.map((unit) => ({
                  label: unit,
                  value: unit,
                }))}
              />
            </div>
          </div>
        ))}
      </div>

      {errors && <p className="text-xs text-destructive">{errors}</p>}
    </div>
  );
}

interface BarterOfferFormProps {
  open: boolean;
  walletAddress: string;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export default function BarterOfferForm({
  open,
  walletAddress,
  onClose,
  onSuccess,
}: BarterOfferFormProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useAppForm(barterOfferSchema, {
    defaultValues: {
      recipientWallet: "",
      offerItems: [emptyItem()],
      requestItems: [emptyItem()],
      expiryHours: 24,
      includeCollateral: false,
      collateralAmount: "",
      collateralCurrency: "STRK",
      notes: "",
    },
  });

  const {
    fields: offerFields,
    append: appendOffer,
    remove: removeOffer,
  } = useFieldArray({
    control: form.control,
    name: "offerItems",
  });

  const {
    fields: requestFields,
    append: appendRequest,
    remove: removeRequest,
  } = useFieldArray({
    control: form.control,
    name: "requestItems",
  });

  const includeCollateral = form.watch("includeCollateral");
  const notesLength = form.watch("notes").length;

  const errorSummary = useMemo(
    () =>
      Object.values(form.formState.errors).flatMap((error) => {
        if (!error) return [];
        if (typeof error.message === "string") return [error.message];
        return [];
      }),
    [form.formState.errors],
  );

  async function submit(values: BarterOfferFormValues) {
    if (!walletAddress) {
      setSaveError("Wallet is not connected.");
      return;
    }

    if (values.recipientWallet.trim() === walletAddress) {
      setSaveError("You cannot barter with yourself.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    const { error } = await withErrorHandling(async () => {
      const payload = {
        proposer_wallet: walletAddress,
        recipient_wallet: values.recipientWallet.trim(),
        offer_items: values.offerItems.map((item) => ({
          ...item,
          product_name: item.product_name.trim(),
          quantity: item.quantity.trim(),
        })),
        request_items: values.requestItems.map((item) => ({
          ...item,
          product_name: item.product_name.trim(),
          quantity: item.quantity.trim(),
        })),
        expiry_hours: values.expiryHours,
        collateral_amount:
          values.includeCollateral && values.collateralAmount
            ? values.collateralAmount.trim()
            : null,
        collateral_currency: values.includeCollateral
          ? values.collateralCurrency
          : null,
        notes: values.notes.trim() || null,
      };

      void payload;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }, {
      form: "BarterOfferForm",
      action: "submit",
    });

    if (error) {
      setSaveError(error.message);
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
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="text-primary size-5" />
            Propose a Barter Trade
          </DialogTitle>
          <DialogDescription>
            Offer goods in exchange for other goods. Both parties must agree
            before the trade is finalised.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
          <FormErrorSummary errors={errorSummary} />

          <FormInput
            name="recipientWallet"
            label="Recipient Wallet Address"
            placeholder="G… or wallet address of the other party"
            register={form.register}
            error={fieldErrorMessage(form.formState.errors, "recipientWallet")}
          />

          <BarterItemSection
            title="You give"
            accent="primary"
            prefix="offerItems"
            register={form.register}
            fields={offerFields}
            remove={removeOffer}
            append={appendOffer}
            errors={form.formState.errors.offerItems?.message}
          />

          <BarterItemSection
            title="You receive"
            accent="amber"
            prefix="requestItems"
            register={form.register}
            fields={requestFields}
            remove={removeRequest}
            append={appendRequest}
            errors={form.formState.errors.requestItems?.message}
          />

          <FormSelect
            name="expiryHours"
            label="Offer expires in"
            register={form.register}
            error={fieldErrorMessage(form.formState.errors, "expiryHours")}
            options={EXPIRY_OPTIONS.map((option) => ({
              label: option.label,
              value: String(option.value),
            }))}
          />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="include-collateral"
                checked={includeCollateral}
                onCheckedChange={(value) =>
                  form.setValue("includeCollateral", Boolean(value), {
                    shouldValidate: true,
                  })
                }
              />
              <Label htmlFor="include-collateral" className="text-sm font-medium">
                Include collateral (if agreed)
              </Label>
            </div>

            {includeCollateral && (
              <div className="grid grid-cols-2 gap-3 pl-7">
                <FormInput
                  name="collateralAmount"
                  label="Collateral amount"
                  type="number"
                  register={form.register}
                  error={fieldErrorMessage(form.formState.errors, "collateralAmount")}
                />
                <FormSelect
                  name="collateralCurrency"
                  label="Currency"
                  register={form.register}
                  options={CURRENCIES.map((currency) => ({
                    label: currency,
                    value: currency,
                  }))}
                />
              </div>
            )}
          </div>

          <FormTextarea
            name="notes"
            label="Notes (optional, max 500)"
            rows={3}
            maxLength={500}
            register={form.register}
            placeholder="Any additional details about this trade…"
            error={fieldErrorMessage(form.formState.errors, "notes")}
          />
          <p className="text-muted-foreground text-right text-xs">{notesLength}/500</p>

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
              Submit Offer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
