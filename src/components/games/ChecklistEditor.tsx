"use client";

import { useState } from "react";
import type { ChecklistItem } from "@/types/games";

/**
 * Checklist section of the note detail page: toggle / relabel / delete
 * existing items, plus an "add" row at the bottom. All mutations are
 * line-number-addressed (see `src/lib/games/checklist.ts`), so this component
 * only needs to hand line numbers back up — it never edits raw markdown
 * itself.
 */
export function ChecklistEditor({
  items,
  onToggle,
  onRelabel,
  onRemove,
  onAdd,
}: {
  items: ChecklistItem[];
  onToggle: (line: number) => void;
  onRelabel: (line: number, label: string) => void;
  onRemove: (line: number) => void;
  onAdd: (label: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function handleAdd() {
    const label = draft.trim();
    if (!label) return;
    onAdd(label);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">チェックリストはありません。</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <ChecklistRow
              key={item.line}
              item={item}
              onToggle={() => onToggle(item.line)}
              onRelabel={(label) => onRelabel(item.line, label)}
              onRemove={() => onRemove(item.line)}
            />
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAdd();
          }}
          placeholder="新しい項目を追加"
          className="flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          追加
        </button>
      </div>
    </div>
  );
}

function ChecklistRow({
  item,
  onToggle,
  onRelabel,
  onRemove,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onRelabel: (label: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.label);

  function commit() {
    setEditing(false);
    const label = draft.trim();
    if (label && label !== item.label) onRelabel(label);
    else setDraft(item.label);
  }

  return (
    <li style={{ paddingLeft: `${item.depth * 1.25}rem` }}>
      <div className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={item.checked} onChange={onToggle} className="mt-0.5" />
        {editing ? (
          <input
            type="text"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit();
              if (event.key === "Escape") {
                setDraft(item.label);
                setEditing(false);
              }
            }}
            className="flex-1 rounded border border-zinc-300 bg-transparent px-1 dark:border-zinc-700"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              // Re-seed the draft from the current label rather than trusting
              // the mount-time initial state: after an add/remove elsewhere
              // in the list, line numbers shift and this row (keyed by
              // `item.line`) can get remounted onto a *different* item under
              // the same key, leaving a stale draft from the previous
              // occupant if we didn't refresh it here.
              setDraft(item.label);
              setEditing(true);
            }}
            className={`flex-1 text-left ${item.checked ? "text-zinc-400 line-through" : ""}`}
          >
            {item.label || <em className="text-zinc-400">(空)</em>}
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="削除"
          className="shrink-0 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
        >
          ×
        </button>
      </div>
    </li>
  );
}
