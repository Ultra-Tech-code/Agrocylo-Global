"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Wallet, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEscrowContract } from "@/hooks/useEscrowContract";
import { useWallet } from "@/hooks/useWallet";
import { useAppForm, fieldErrorMessage } from "@/hooks/useAppForm";
import { orderFormSchema } from "@/lib/validation";
import { FormInput, FormTextarea } from "@/components/forms/FormField";
import FormErrorSummary from "@/components/forms/FormErrorSummary";
import { withErrorHandling } from "@/lib/errorHandler";

const PLATFORM_FEE_PCT = 3;

const NATIVE_TOKEN_CONTRACT_ID =
  process.env.NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID ?? "";

export default function CreateOrderForm() {
  const searchParams = useSearchParams();
  const prefilledFarmer = searchParams.get("farmer") ?? "";

  const { connected } = useWallet();
  const { createOrder, createState } = useEscrowContract();

  const [txStep, setTxStep] = useState<"idle" | "signing" | "done" | "error">(
    "idle",
  );
  const [txHash, setTxHash] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useAppForm(orderFormSchema, {
    defaultValues: {
      farmer: prefilledFarmer,
      amount: 0,
      deliveryDeadline: "",
      description: "",
    },
  });

  const watchedAmount = form.watch("amount");
  const hasAmount = Number(watchedAmount) > 0;

  const fee = useMemo(
    () => (hasAmount ? (Number(watchedAmount) * PLATFORM_FEE_PCT) / 100 : 0),
    [hasAmount, watchedAmount],
  );
  const farmerReceives = useMemo(
    () => (hasAmount ? Number(watchedAmount) - fee : 0),
    [fee, hasAmount, watchedAmount],
  );

  const errorSummary = useMemo(
    () =>
      Object.values(form.formState.errors).flatMap((error) =>
        error?.message ? [String(error.message)] : [],
      ),
    [form.formState.errors],
  );

  async function handleSubmit(values: {
    farmer: string;
    amount: number;
    deliveryDeadline: string;
    description: string;
  }) {
    if (!NATIVE_TOKEN_CONTRACT_ID) {
      setTxStep("error");
      setSubmitError("Native token contract is not configured.");
      return;
    }

    setSubmitError(null);
    setTxStep("signing");

    const { data, error } = await withErrorHandling(async () => {
      const stroops = BigInt(Math.round(values.amount * 1e7));
      return createOrder(
        values.farmer.trim(),
        NATIVE_TOKEN_CONTRACT_ID,
        stroops,
        values.deliveryDeadline,
      );
    }, {
      form: "CreateOrderForm",
      action: "submit",
    });

    if (error || !data) {
      setTxStep("error");
      setSubmitError(error?.message ?? "Transaction failed. Please try again.");
      return;
    }

    setTxStep("done");
    setTxHash(data?.txHash ?? null);
  }

  if (txStep === "done") {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="bg-primary/10 grid size-16 place-content-center rounded-full">
            <CheckCircle2 className="text-primary size-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Order Created</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Funds are now locked in escrow. The farmer ships, you confirm
              receipt, the contract releases payment.
            </p>
          </div>
          {txHash && (
            <div className="bg-secondary/50 w-full rounded-xl border p-3 text-left">
              <p className="text-muted-foreground text-xs">Transaction hash</p>
              <p className="mt-1 break-all font-mono text-xs">{txHash}</p>
            </div>
          )}
          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/orders">View Orders</Link>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                form.reset({
                  farmer: prefilledFarmer,
                  amount: 0,
                  deliveryDeadline: "",
                  description: "",
                });
                setTxStep("idle");
                setTxHash(null);
              }}
            >
              Create Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="bg-secondary text-muted-foreground grid size-12 place-content-center rounded-full">
            <Wallet className="size-5" />
          </div>
          <h2 className="text-lg font-semibold">Connect your wallet</h2>
          <p className="text-muted-foreground text-sm">
            Sign in with Freighter to create an escrow order.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!NATIVE_TOKEN_CONTRACT_ID) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-2 py-6 text-sm">
          <h2 className="font-semibold">Token contract not configured</h2>
          <p className="text-muted-foreground">
            Set{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID
            </code>{" "}
            in{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              .env.local
            </code>{" "}
            to the XLM SAC for your network before the form will work.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShieldCheck className="text-primary size-5" />
          Create Escrow Order
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Funds are held in a Soroban escrow until you confirm receipt of goods.
          If the farmer doesn&apos;t deliver in time, you can refund.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-5"
          noValidate
        >
          <FormErrorSummary errors={errorSummary} />

          <FormInput
            name="farmer"
            label="Farmer Address"
            placeholder="G…"
            register={form.register}
            error={fieldErrorMessage(form.formState.errors, "farmer")}
          />

          <FormInput
            name="amount"
            label="Amount (XLM)"
            type="number"
            placeholder="0.00"
            register={form.register}
            error={fieldErrorMessage(form.formState.errors, "amount")}
          />

          <FormInput
            name="deliveryDeadline"
            label="Delivery deadline"
            type="datetime-local"
            hint="If the farmer doesn't deliver by this time, you can refund the escrow."
            register={form.register}
            error={fieldErrorMessage(form.formState.errors, "deliveryDeadline")}
          />

          <FormTextarea
            name="description"
            label="Description (optional)"
            rows={2}
            placeholder="e.g. 50kg organic tomatoes"
            register={form.register}
            error={fieldErrorMessage(form.formState.errors, "description")}
          />

          {hasAmount && (
            <div className="bg-secondary/40 space-y-2 rounded-2xl border p-4 text-sm">
              <Row label="You pay" value={`${Number(watchedAmount).toFixed(2)} XLM`} />
              <Row
                label={`Platform fee (${PLATFORM_FEE_PCT}%)`}
                value={`${fee.toFixed(2)} XLM`}
                muted
              />
              <Separator />
              <Row
                label="Farmer receives"
                value={`${farmerReceives.toFixed(2)} XLM`}
                bold
              />
            </div>
          )}

          {(createState.error || submitError || txStep === "error") && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {submitError ?? createState.error ?? "Transaction failed. Please try again."}
            </div>
          )}

          <Button
            size="lg"
            type="submit"
            disabled={!form.formState.isValid}
            isLoading={createState.isLoading}
            className="w-full"
          >
            {txStep === "signing"
              ? "Sign in wallet…"
              : "Confirm & Create Escrow Order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${
        muted ? "text-muted-foreground" : ""
      } ${bold ? "text-base font-semibold" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
