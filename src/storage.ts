import { useEffect, useState } from "react";

export const isViewerMode = new URLSearchParams(window.location.search).get("view") === "readonly";

// Run viewer migrations in memory without accessing the editor's saved data.
const viewerValues = new Map<string, string>();
export const appStorage = isViewerMode
  ? {
      getItem: (key: string) => viewerValues.get(key) ?? null,
      setItem: (key: string, value: string) => { viewerValues.set(key, value); }
    }
  : window.localStorage;

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = appStorage.getItem(key);
    if (stored == null) return initialValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    appStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}


