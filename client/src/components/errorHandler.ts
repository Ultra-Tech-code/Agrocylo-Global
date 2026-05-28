import { toAppError } from "@/lib/errorHandler";

export type BlockchainErrorKind =
  | "insufficient_balance"
  | "user_rejected"
  | "network_unavailable"
  | "unknown";

export interface BlockchainErrorInfo {
  kind: BlockchainErrorKind;
  title: string;
  message: string;
  action: string;
  docsUrl: string;
}

function mapToLegacyKind(error: unknown): BlockchainErrorKind {
  const raw =
    typeof error === "string"
      ? error.toLowerCase()
      : error instanceof Error
        ? error.message.toLowerCase()
        : "";

  if (/insufficient/.test(raw)) return "insufficient_balance";
  if (/reject|denied|cancel/.test(raw)) return "user_rejected";
  if (/network|timeout|unavailable/.test(raw)) return "network_unavailable";
  return "unknown";
}

export function mapBlockchainError(error: unknown): BlockchainErrorInfo {
  const details = toAppError(error);

  return {
    kind: mapToLegacyKind(error),
    title: details.title,
    message: details.message,
    action: details.recovery,
    docsUrl: details.docsUrl,
  };
}
