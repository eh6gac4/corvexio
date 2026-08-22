"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { AsyncStatus } from "@/components/AsyncStatus";
import { useGameNotes } from "@/lib/games/useGameNotes";
import { gameNoteHref } from "@/lib/games/notes";
import type { GameNote } from "@/types/games";

const STATUS_FILTERS = ["all", "todo", "doing", "done"] as const;
const PRIORITY_FILTERS = ["all", "must", "should", "could"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1 text-xs ${
            option === value
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function checklistProgress(note: GameNote): string | null {
  if (note.checklist.length === 0) return null;
  const done = note.checklist.filter((item) => item.checked).length;
  return `${done}/${note.checklist.length}`;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function GameNotesPage({ params }: PageProps) {
  const { slug } = use(params);
  return <GameNotesView slug={slug} />;
}

/**
 * Split out from the page so it can be tested directly with a plain `slug`
 * prop, rather than the `use(params)` promise the page unwraps (which needs
 * a Suspense boundary Next.js supplies for real routes but tests don't).
 */
export function GameNotesView({ slug }: { slug: string }) {
  const { notes, loading, error } = useGameNotes();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");

  const filtered = useMemo(() => {
    return notes
      .filter((note) => note.game === slug && note.type !== "index")
      .filter((note) => status === "all" || note.status === status)
      .filter((note) => priority === "all" || note.priority === priority);
  }, [notes, slug, status, priority]);

  if (loading || error) {
    return <AsyncStatus loading={loading} error={error} />;
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-2">
        <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <FilterChips options={PRIORITY_FILTERS} value={priority} onChange={setPriority} />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">条件に一致するノートがありません。</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {filtered.map((note) => {
            const progress = checklistProgress(note);
            return (
              <li key={note.path}>
                <Link
                  href={gameNoteHref(note.game, note.path)}
                  className="flex items-center justify-between gap-2 px-2 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{note.title}</div>
                    <div className="mt-0.5 flex gap-1.5 text-xs text-zinc-500">
                      {note.status && <span>{note.status}</span>}
                      {note.priority && <span>· {note.priority}</span>}
                    </div>
                  </div>
                  {progress && (
                    <span className="shrink-0 text-xs text-zinc-500">{progress}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
