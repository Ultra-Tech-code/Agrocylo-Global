"use client";

import React, { createContext, useState, useCallback, useMemo, useContext, useEffect } from "react";
import { useContextDebug } from "@/hooks/useContextDebug";
import type {
  TransactionFeedback,
  TransactionFeedbackContextType,
  TransactionFeedbackProviderProps,
} from "@/types/transaction";

const DEFAULT_FEEDBACK: TransactionFeedback = {
  state: "idle",
};

type TransactionFeedbackState = {
  feedback: TransactionFeedback;
  isLoading: boolean;
  isTerminal: boolean;
};

type TransactionFeedbackActions = Pick<
  TransactionFeedbackContextType,
  "initiate" | "pending" | "confirming" | "success" | "failure" | "reset"
>;

export const TransactionFeedbackContext =
  createContext<TransactionFeedbackContextType | null>(null);

const TransactionFeedbackStateContext = createContext<TransactionFeedbackState | null>(null);
const TransactionFeedbackActionsContext = createContext<TransactionFeedbackActions | null>(null);

export function TransactionFeedbackProvider({ children }: TransactionFeedbackProviderProps) {
  const [feedback, setFeedback] = useState<TransactionFeedback>(DEFAULT_FEEDBACK);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const persisted = localStorage.getItem("tx.feedback.last");
    if (!persisted) return;

    try {
      const parsed = JSON.parse(persisted) as TransactionFeedback;
      if (parsed.state && parsed.state !== "idle") {
        setFeedback(parsed);
      }
    } catch {
      // ignore malformed data
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("tx.feedback.last", JSON.stringify(feedback));
  }, [feedback]);

  const initiate = useCallback((message?: string) => {
    setFeedback({
      state: "pending",
      message: message || "Initiating transaction...",
      timestamp: Date.now(),
    });
  }, []);

  const pending = useCallback((message?: string) => {
    setFeedback((prev) => ({
      ...prev,
      state: "pending",
      message,
      timestamp: Date.now(),
    }));
  }, []);

  const confirming = useCallback((message?: string) => {
    setFeedback((prev) => ({
      ...prev,
      state: "confirming",
      message: message || "Awaiting blockchain confirmation...",
      timestamp: Date.now(),
    }));
  }, []);

  const success = useCallback((txHash: string) => {
    setFeedback({
      state: "success",
      txHash,
      message: "Transaction confirmed successfully",
      timestamp: Date.now(),
    });
  }, []);

  const failure = useCallback((error: string) => {
    setFeedback({
      state: "failure",
      errorMessage: error,
      message: "Transaction failed",
      timestamp: Date.now(),
    });
  }, []);

  const reset = useCallback(() => {
    setFeedback(DEFAULT_FEEDBACK);
  }, []);

  const isLoading = feedback.state === "pending" || feedback.state === "confirming";
  const isTerminal = feedback.state === "success" || feedback.state === "failure";

  const stateValue = useMemo<TransactionFeedbackState>(
    () => ({ feedback, isLoading, isTerminal }),
    [feedback, isLoading, isTerminal],
  );

  const actionsValue = useMemo<TransactionFeedbackActions>(
    () => ({ initiate, pending, confirming, success, failure, reset }),
    [initiate, pending, confirming, success, failure, reset],
  );

  const value = useMemo<TransactionFeedbackContextType>(
    () => ({ ...stateValue, ...actionsValue }),
    [stateValue, actionsValue],
  );

  useContextDebug("transaction-feedback-state", stateValue);

  return (
    <TransactionFeedbackActionsContext.Provider value={actionsValue}>
      <TransactionFeedbackStateContext.Provider value={stateValue}>
        <TransactionFeedbackContext.Provider value={value}>
          {children}
        </TransactionFeedbackContext.Provider>
      </TransactionFeedbackStateContext.Provider>
    </TransactionFeedbackActionsContext.Provider>
  );
}

export function useTransactionFeedbackState() {
  const ctx = useContext(TransactionFeedbackStateContext);
  if (!ctx) {
    throw new Error(
      "useTransactionFeedbackState must be used within TransactionFeedbackProvider",
    );
  }
  return ctx;
}

export function useTransactionFeedbackActions() {
  const ctx = useContext(TransactionFeedbackActionsContext);
  if (!ctx) {
    throw new Error(
      "useTransactionFeedbackActions must be used within TransactionFeedbackProvider",
    );
  }
  return ctx;
}

export function useTransactionFeedbackSelector<T>(
  selector: (state: TransactionFeedbackState) => T,
): T {
  const state = useTransactionFeedbackState();
  return selector(state);
}
