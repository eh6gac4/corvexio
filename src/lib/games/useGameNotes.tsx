"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchGames } from "@/lib/api-client";
import type { GameNote } from "@/types/games";

interface GameNotesState {
  notes: GameNote[];
  loading: boolean;
  error: string | null;
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

  useEffect(() => {
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

  return (
    <GameNotesContext.Provider value={{ notes, loading, error }}>
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
