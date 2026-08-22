"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFile, saveFile } from "@/lib/api-client";

export interface NoteContentState {
  content: string | null;
  loading: boolean;
  error: string | null;
  /**
   * Applies `transform` optimistically and persists the result. On save
   * failure, re-fetches the file from the server to resync `content` to the
   * true upstream state — simpler and more robust than trying to invert an
   * arbitrary transform (append/remove/relabel don't have a generic inverse
   * the way toggle does).
   */
  mutate: (transform: (content: string) => string) => Promise<void>;
}

/**
 * `onSaved`, if given, runs after every successful save with the new
 * content — not just some mutations. Wiring it at the hook level (rather
 * than trusting each call site to remember to invoke a resync callback)
 * means every current and future mutation path gets it for free.
 */
export function useNoteContent(path: string, onSaved?: (content: string) => void): NoteContentState {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mirrors `content` synchronously so `mutate` can read the latest value
  // right when it's called. Reading `content` from a state updater instead
  // doesn't work here: React only *queues* a functional setState update, it
  // doesn't run the updater synchronously, so code right after `setContent`
  // can't rely on it having run yet (that queued run is exactly what applies
  // "two mutations in quick succession build on each other" — the ref just
  // gives `mutate` a synchronous read of the same up-to-date value).
  const contentRef = useRef<string | null>(null);
  function apply(value: string | null) {
    contentRef.current = value;
    setContent(value);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFile(path)
      .then((file) => {
        if (!cancelled) apply(file.content);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const mutate = useCallback(
    async (transform: (content: string) => string) => {
      const current = contentRef.current;
      if (current === null) return;
      const next = transform(current);
      apply(next);
      try {
        await saveFile(path, next);
        onSaved?.(next);
      } catch (err) {
        setError((err as Error).message);
        try {
          const file = await fetchFile(path);
          apply(file.content);
        } catch {
          // Resync itself failed (e.g. still offline) — leave the optimistic
          // content in place rather than blanking the view; the save error
          // above is already surfaced.
        }
      }
    },
    [path, onSaved],
  );

  return { content, loading, error, mutate };
}
