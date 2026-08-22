"use client";

import { use, useCallback, useMemo } from "react";
import Link from "next/link";
import { AsyncStatus } from "@/components/AsyncStatus";
import { ChecklistEditor } from "@/components/games/ChecklistEditor";
import { StatusEditor, PriorityEditor } from "@/components/games/NoteFieldEditor";
import { editHref } from "@/lib/vault-route";
import { buildGameNote, decodeGameNotePath, noteTitle } from "@/lib/games/notes";
import { parseFrontmatter, setFrontmatterField, stripWikilink, todayIso } from "@/lib/games/frontmatter";
import {
  appendChecklistItem,
  parseChecklist,
  removeChecklistLine,
  setChecklistLabel,
  toggleChecklistLine,
} from "@/lib/games/checklist";
import { useNoteContent } from "@/lib/games/useNoteContent";
import { useGameNotes } from "@/lib/games/useGameNotes";

const FIELD_LABELS: Record<string, string> = {
  updated: "更新日",
  parent: "親",
  next: "次",
  source: "参照元",
};

interface PageProps {
  params: Promise<{ slug: string; note: string }>;
}

export default function GameNoteDetailPage({ params }: PageProps) {
  const { slug, note } = use(params);
  const path = decodeGameNotePath(slug, note);
  return <GameNoteDetailView path={path} />;
}

/** Split out from the page so it can be tested with a plain `path` prop, same reasoning as `GameNotesView` in `[slug]/page.tsx`. */
export function GameNoteDetailView({ path }: { path: string }) {
  const { patchNote } = useGameNotes();

  // Keeps the shared game list (filters, checklist-progress badges) in sync
  // with every successful edit here — cheaper than a full /api/games
  // re-fetch, and wired through the hook itself so no mutation path can
  // forget to call it (see useNoteContent's `onSaved` doc comment).
  const onSaved = useCallback(
    (next: string) => {
      const note = buildGameNote(path, next);
      if (note) patchNote(note);
    },
    [path, patchNote],
  );

  const { content, loading, error, mutate } = useNoteContent(path, onSaved);

  const data = useMemo(() => (content === null ? {} : parseFrontmatter(content).data), [content]);
  const checklist = useMemo(() => (content === null ? [] : parseChecklist(content)), [content]);

  function setField(key: string, value: string) {
    void mutate((current) =>
      setFrontmatterField(setFrontmatterField(current, key, value), "updated", todayIso()),
    );
  }

  function handleToggle(line: number) {
    void mutate((current) => toggleChecklistLine(current, line));
  }

  function handleRelabel(line: number, label: string) {
    void mutate((current) => setChecklistLabel(current, line, label));
  }

  function handleRemove(line: number) {
    void mutate((current) => removeChecklistLine(current, line));
  }

  function handleAdd(label: string) {
    void mutate((current) => appendChecklistItem(current, label));
  }

  if (loading || (error && content === null)) {
    return <AsyncStatus loading={loading} error={content === null ? error : null} />;
  }
  if (content === null) return null;

  const title = noteTitle(path);
  const status = typeof data.status === "string" ? data.status : undefined;
  const priority = typeof data.priority === "string" ? data.priority : undefined;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-lg font-semibold">{title}</h1>
        <Link
          href={editHref(path)}
          className="shrink-0 rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          編集
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <StatusEditor value={status} onChange={(value) => setField("status", value)} />
        <PriorityEditor value={priority} onChange={(value) => setField("priority", value)} />
      </div>

      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
        {Object.entries(FIELD_LABELS).map(([key, label]) => {
          const value = data[key];
          if (!value) return null;
          const text = typeof value === "string" ? stripWikilink(value) : value.join(", ");
          return (
            <div key={key} className="flex gap-1">
              <dt className="font-medium">{label}:</dt>
              <dd>{text}</dd>
            </div>
          );
        })}
      </dl>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <ChecklistEditor
        items={checklist}
        onToggle={handleToggle}
        onRelabel={handleRelabel}
        onRemove={handleRemove}
        onAdd={handleAdd}
      />
    </div>
  );
}
