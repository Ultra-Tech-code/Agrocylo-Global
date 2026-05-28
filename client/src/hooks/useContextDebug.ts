"use client";

import { useEffect } from "react";

export function useContextDebug(name: string, value: unknown) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    // eslint-disable-next-line no-console
    console.debug(`[context:${name}] updated`, value);
  }, [name, value]);
}
