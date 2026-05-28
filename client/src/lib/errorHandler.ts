import { logger } from "@/lib/logger";

export type ErrorCategory =
  | "network"
  | "auth"
  | "validation"
  | "blockchain"
  | "wallet"
  | "unknown";

export interface AppErrorDetails {
  category: ErrorCategory;
  title: string;
  message: string;
  recovery: string;
  docsUrl: string;
}

const DOCS_BY_CATEGORY: Record<ErrorCategory, string> = {
  network: "/QUICK_START.md#troubleshooting",
  auth: "/USER_GUIDE.md#account-and-wallet",
  validation: "/USER_GUIDE.md#form-validation",
  blockchain: "/API.md#blockchain-flows",
  wallet: "/USER_GUIDE.md#wallet-connection",
  unknown: "/IMPLEMENTATION_GUIDE.md#error-handling",
};

const LOCALIZED_MESSAGES: Record<
  ErrorCategory,
  { title: string; message: string; recovery: string }
> = {
  network: {
    title: "Network issue",
    message:
      "We couldn't reach the service. Please check your internet connection and try again.",
    recovery: "Retry the action or switch to a stable connection.",
  },
  auth: {
    title: "Authentication required",
    message:
      "Your session may have expired or access is denied for this action.",
    recovery: "Reconnect your wallet or sign in again.",
  },
  validation: {
    title: "Please review your input",
    message: "Some fields are invalid or missing required values.",
    recovery: "Fix highlighted fields and submit again.",
  },
  blockchain: {
    title: "Blockchain transaction error",
    message:
      "The network could not complete this transaction at the moment.",
    recovery:
      "Verify transaction details, wallet balance, and retry after a few seconds.",
  },
  wallet: {
    title: "Wallet action needed",
    message:
      "Your wallet rejected the request or is currently unavailable.",
    recovery: "Unlock your wallet and approve the request.",
  },
  unknown: {
    title: "Unexpected error",
    message: "An unexpected error occurred while processing your request.",
    recovery: "Retry the action. If the issue persists, contact support.",
  },
};

function toErrorString(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function classifyError(error: unknown): ErrorCategory {
  const raw = toErrorString(error).toLowerCase();

  if (!raw) return "unknown";
  if (/network|fetch|timeout|offline|unreachable|failed to fetch/.test(raw)) {
    return "network";
  }
  if (/unauthorized|forbidden|token|session|auth/.test(raw)) {
    return "auth";
  }
  if (/invalid|required|schema|validation|too short|too long/.test(raw)) {
    return "validation";
  }
  if (/wallet|freighter|rejected|denied|signature/.test(raw)) {
    return "wallet";
  }
  if (/soroban|stellar|escrow|blockchain|insufficient|transaction/.test(raw)) {
    return "blockchain";
  }

  return "unknown";
}

export function toAppError(error: unknown): AppErrorDetails {
  const category = classifyError(error);
  const localized = LOCALIZED_MESSAGES[category];

  return {
    category,
    title: localized.title,
    message: localized.message,
    recovery: localized.recovery,
    docsUrl: DOCS_BY_CATEGORY[category],
  };
}

export function handleAppError(
  error: unknown,
  context: Record<string, unknown> = {},
): AppErrorDetails {
  const appError = toAppError(error);
  logger.error(appError.title, {
    ...context,
    category: appError.category,
    rawError: toErrorString(error),
  });
  return appError;
}

export async function withErrorHandling<T>(
  work: () => Promise<T>,
  context: Record<string, unknown> = {},
): Promise<{ data?: T; error?: AppErrorDetails }> {
  try {
    const data = await work();
    return { data };
  } catch (error) {
    return { error: handleAppError(error, context) };
  }
}
