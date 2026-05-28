import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { useTransactionFeedback } from "@/hooks/useTransactionFeedback";
import { TransactionFeedbackProvider } from "@/context/TransactionFeedbackContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TransactionFeedbackProvider>{children}</TransactionFeedbackProvider>
);

describe("TransactionFeedbackContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts idle and transitions through success flow", () => {
    const { result } = renderHook(() => useTransactionFeedback(), { wrapper });

    expect(result.current.feedback.state).toBe("idle");

    act(() => {
      result.current.pending("Sending...");
    });
    expect(result.current.feedback.state).toBe("pending");

    act(() => {
      result.current.success("hash-123");
    });

    expect(result.current.feedback.state).toBe("success");
    expect(result.current.feedback.txHash).toBe("hash-123");
  });
});
