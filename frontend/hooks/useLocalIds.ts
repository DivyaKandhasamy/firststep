"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A string-id list persisted in localStorage (no auth). Hydration-safe: starts empty on the
 * server/first render, then loads. Synced across tabs. All storage access is try/catch-wrapped.
 */
export function useLocalIds(key: string) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const v = JSON.parse(localStorage.getItem(key) || "[]");
        setIds(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
      } catch {
        setIds([]);
      }
    };
    read();
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === key && read();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  useEffect(() => {
    if (!ready) return; // never overwrite stored data with the initial empty state
    try {
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      /* private mode / quota: state still works in memory */
    }
  }, [ids, key, ready]);

  const toggle = useCallback(
    (id: string) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])),
    [],
  );
  const remove = useCallback((id: string) => setIds((cur) => cur.filter((x) => x !== id)), []);

  return { ids, toggle, remove, ready };
}
