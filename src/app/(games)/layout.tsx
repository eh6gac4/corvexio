import type { ReactNode } from "react";
import Link from "next/link";
import { GameNotesProvider } from "@/lib/games/useGameNotes";

/**
 * Independent from (shell)'s two-pane vault-editor layout: the games views
 * are a single scrollable pane (list/filter/detail), and the file-tree
 * sidebar would just be clutter here. Kept as its own route group so a
 * future extraction only has to take this directory + api/games along.
 *
 * GameNotesProvider lives here (not per-page) so the /api/games aggregate is
 * fetched once per (games) mount and shared across /games <-> /games/[slug]
 * client-side navigations, rather than every view re-fetching it.
 */
export default function GamesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <Link
          href="/"
          className="rounded px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ← Vault
        </Link>
        <span className="text-sm font-medium text-zinc-500">ゲーム攻略</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <GameNotesProvider>{children}</GameNotesProvider>
      </div>
    </div>
  );
}
