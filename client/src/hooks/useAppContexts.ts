"use client";

import { useWallet } from "@/hooks/useWallet";
import { useCart } from "@/context/CartContext";
import { useTransactionFeedback } from "@/hooks/useTransactionFeedback";

export function useAppContexts() {
  const wallet = useWallet();
  const cart = useCart();
  const transactionFeedback = useTransactionFeedback();

  return {
    wallet,
    cart,
    transactionFeedback,
  };
}
