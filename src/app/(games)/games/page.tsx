"use client";

import Link from "next/link";
import { AsyncStatus } from "@/components/AsyncStatus";
import { useGameNotes } from "@/lib/games/useGameNotes";

interface GameSummary {
  game: string;
  total: number;
  done: number;
}

function summarize(notes: ReturnType<typeof useGameNotes>["notes"]): GameSummary[] {
  const byGame = new Map<string, GameSummary>();
  for (const note of notes) {
    if (note.type === "index") continue;
    const summary = byGame.get(note.game) ?? { game: note.game, total: 0, done: 0 };
    summary.total += 1;
    if (note.status === "done") summary.done += 1;
    byGame.set(note.game, summary);
  }
  return [...byGame.values()].sort((a, b) => a.game.localeCompare(b.game));
}

export default function GamesIndexPage() {
  const { notes, loading, error } = useGameNotes();

  if (loading || error) {
    return <AsyncStatus loading={loading} error={error} />;
  }

  const summaries = summarize(notes);

  if (summaries.length === 0) {
    return <p className="p-4 text-sm text-zinc-500">Games/ にノートが見つかりません。</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {summaries.map((summary) => (
        <li key={summary.game}>
          <Link
            href={`/games/${encodeURIComponent(summary.game)}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <span className="font-medium">{summary.game}</span>
            <span className="text-sm text-zinc-500">
              {summary.done} / {summary.total} 完了
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
