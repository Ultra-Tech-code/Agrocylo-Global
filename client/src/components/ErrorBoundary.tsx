"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { handleAppError, type AppErrorDetails } from "@/lib/errorHandler";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  details: AppErrorDetails | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    details: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      details: handleAppError(error, { scope: "ErrorBoundary:getDerivedStateFromError" }),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    handleAppError(error, {
      scope: "ErrorBoundary:componentDidCatch",
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, details: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const details = this.state.details;

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">{details?.title ?? "Something went wrong"}</h2>
            <p className="text-sm text-muted-foreground">
              {details?.message ?? "An unexpected error occurred."}
            </p>
            {details?.recovery && (
              <p className="text-xs text-muted-foreground">Recovery: {details.recovery}</p>
            )}
            {details?.docsUrl && (
              <p className="text-xs">
                <Link href={details.docsUrl} className="underline">
                  Open troubleshooting guide
                </Link>
              </p>
            )}
            {this.state.error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded bg-muted p-2 text-left text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
            <div className="space-x-2 pt-4">
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry Page
              </Button>
              <Button onClick={this.handleReset}>Go Home</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
