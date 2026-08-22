"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AsyncStatus } from "@/components/AsyncStatus";
import { fetchFile, saveFile } from "@/lib/api-client";
import { editHref } from "@/lib/vault-route";
import { decodeGameNotePath, noteTitle } from "@/lib/games/notes";
import { parseFrontmatter, stripWikilink } from "@/lib/games/frontmatter";
import { parseChecklist, toggleChecklistLine } from "@/lib/games/checklist";

const FIELD_LABELS: Record<string, string> = {
  status: "状態",
  priority: "優先度",
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

  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFile(path)
      .then((file) => {
        if (!cancelled) setContent(file.content);
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

  const data = useMemo(() => (content === null ? {} : parseFrontmatter(content).data), [content]);
  const checklist = useMemo(() => (content === null ? [] : parseChecklist(content)), [content]);

  const handleToggle = useCallback(
    async (line: number) => {
      // Functional updates (not a `content` closure) so two toggles fired
      // in quick succession each read the other's optimistic result rather
      // than racing on a stale snapshot; a failed save re-toggles the same
      // line on whatever content is current, undoing only its own change.
      let nextContent: string | null = null;
      setContent((current) => {
        if (current === null) return current;
        nextContent = toggleChecklistLine(current, line);
        return nextContent;
      });
      if (nextContent === null) return;
      try {
        await saveFile(path, nextContent);
      } catch (err) {
        setContent((current) => (current === null ? current : toggleChecklistLine(current, line)));
        setError((err as Error).message);
      }
    },
    [path],
  );

  if (loading || (error && content === null)) {
    return <AsyncStatus loading={loading} error={content === null ? error : null} />;
  }
  if (content === null) return null;

  const title = noteTitle(path);

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

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {checklist.length === 0 ? (
        <p className="text-sm text-zinc-500">チェックリストはありません。</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {checklist.map((item) => (
            <li
              key={item.line}
              style={{ paddingLeft: `${item.depth * 1.25}rem` }}
            >
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleToggle(item.line)}
                  className="mt-0.5"
                />
                <span className={item.checked ? "text-zinc-400 line-through" : ""}>
                  {item.label || <em className="text-zinc-400">(空)</em>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
