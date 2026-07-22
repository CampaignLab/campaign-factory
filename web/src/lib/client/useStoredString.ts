"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Read a local-storage string without creating a server/client hydration mismatch. */
export function useStoredString(key: string): string {
  const subscribe = useCallback(
    (notify: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) notify();
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  }, [key]);

  return useSyncExternalStore(subscribe, getSnapshot, () => "");
}
