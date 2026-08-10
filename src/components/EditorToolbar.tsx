"use client";

import Link from "next/link";

interface Props {
  path: string;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDelete: () => void;
}

export function EditorToolbar({ path, dirty, saving, onSave, onDelete }: Props) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <Link
        href="/"
        className="rounded px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
      >
        ← 戻る
      </Link>
      <span className="flex-1 truncate text-sm font-medium">
        {path}
        {dirty && (
          <span className="ml-1.5 text-amber-600 dark:text-amber-400" title="未保存の変更があります">
            ●
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={onDelete}
        className="rounded px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        削除
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || saving}
        className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {saving ? "保存中…" : "保存"}
      </button>
    </div>
  );
}
