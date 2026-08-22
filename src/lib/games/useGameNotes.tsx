"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchGames } from "@/lib/api-client";
import type { GameNote } from "@/types/games";

interface GameNotesState {
  notes: GameNote[];
  loading: boolean;
  error: string | null;
  /** Re-fetches /api/games — call after creating a note, since a brand-new note isn't in `notes` yet for `patchNote` to update. */
  refresh: () => void;
  /**
   * Updates one already-listed note in place, without a round trip through
   * /api/games's full recursive vault walk. Call after any local edit to an
   * existing note (frontmatter field, checklist change) with the same
   * `GameNote` the edit produced, so the game list's filters/progress badges
   * reflect it immediately.
   */
  patchNote: (note: GameNote) => void;
}

const GameNotesContext = createContext<GameNotesState | null>(null);

/**
 * Fetches the /api/games aggregate once per (games) route-group mount,
 * shared by every view under it via context — without this, navigating
 * /games -> /games/[slug] would re-trigger the full recursive vault walk
 * + per-file read that each view's own useGameNotes() used to do
 * independently. Plain useState + useEffect, matching the rest of the app
 * (react-hooks/set-state-in-effect is deliberately off — see eslint.config.mjs).
 */
export function GameNotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<GameNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchGames()
      .then((data) => {
        if (!cancelled) setNotes(data);
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
  }, []);

  useEffect(() => load(), [load]);

  const patchNote = useCallback((note: GameNote) => {
    setNotes((current) => current.map((existing) => (existing.path === note.path ? note : existing)));
  }, []);

  return (
    <GameNotesContext.Provider value={{ notes, loading, error, refresh: load, patchNote }}>
      {children}
    </GameNotesContext.Provider>
  );
}

export function useGameNotes(): GameNotesState {
  const state = useContext(GameNotesContext);
  if (!state) {
    throw new Error("useGameNotes must be used within a GameNotesProvider");
  }
  return state;
}
