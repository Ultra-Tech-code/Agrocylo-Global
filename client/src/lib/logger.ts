export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

interface LoggerOptions {
  endpoint?: string;
  batchSize?: number;
  flushIntervalMs?: number;
  storageKey?: string;
}

const DEFAULT_OPTIONS: Required<LoggerOptions> = {
  endpoint: "/api/logs/client",
  batchSize: 10,
  flushIntervalMs: 5000,
  storageKey: "agrocylo.client.logs",
};

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class ClientLogger {
  private readonly options: Required<LoggerOptions>;
  private queue: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(options: LoggerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    if (typeof window !== "undefined") {
      this.queue = safeJsonParse<LogEntry[]>(
        localStorage.getItem(this.options.storageKey),
        [],
      );
      this.start();

      window.addEventListener("beforeunload", () => {
        void this.flush({ useBeacon: true });
      });
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log("error", message, context);
  }

  log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      level,
      message,
      context,
      timestamp: Date.now(),
    };

    this.queue.push(entry);
    this.persistQueue();

    if (this.queue.length >= this.options.batchSize) {
      void this.flush();
    }

    const method = level === "debug" ? "log" : level;
    console[method](`[${level}] ${message}`, context ?? "");
  }

  start() {
    if (this.flushTimer || typeof window === "undefined") return;
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.options.flushIntervalMs);
  }

  stop() {
    if (!this.flushTimer) return;
    clearInterval(this.flushTimer);
    this.flushTimer = null;
  }

  async flush({ useBeacon = false }: { useBeacon?: boolean } = {}) {
    if (this.flushing || this.queue.length === 0 || typeof window === "undefined") {
      return;
    }

    this.flushing = true;
    const batch = this.queue.slice(0, this.options.batchSize);

    try {
      if (useBeacon && typeof navigator.sendBeacon === "function") {
        const payload = JSON.stringify({ logs: batch });
        const ok = navigator.sendBeacon(
          this.options.endpoint,
          new Blob([payload], { type: "application/json" }),
        );
        if (!ok) throw new Error("sendBeacon failed");
      } else {
        const response = await fetch(this.options.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ logs: batch }),
        });

        if (!response.ok) {
          throw new Error(`Failed to transmit logs (${response.status})`);
        }
      }

      this.queue = this.queue.slice(batch.length);
      this.persistQueue();
    } catch {
      this.persistQueue();
    } finally {
      this.flushing = false;
    }
  }

  private persistQueue() {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.options.storageKey, JSON.stringify(this.queue));
  }
}

export const logger = new ClientLogger();
