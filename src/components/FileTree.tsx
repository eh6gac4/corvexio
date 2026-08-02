"use client";

import { useEffect, useState } from "react";
import { fetchTree } from "@/lib/api-client";
import { FileTreeNode } from "@/components/FileTreeNode";
import type { TreeEntry } from "@/types/vault";

export function FileTree() {
  const [entries, setEntries] = useState<TreeEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTree("")
      .then((result) => {
        if (!cancelled) setEntries(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="p-3 text-sm text-red-600">{error}</p>;
  if (!entries) return <p className="p-3 text-sm text-zinc-500">読み込み中…</p>;
  if (entries.length === 0) return <p className="p-3 text-sm text-zinc-500">Vaultは空です。</p>;

  return (
    <ul className="flex-1 overflow-y-auto py-1">
      {entries.map((entry) => (
        <FileTreeNode key={entry.path} entry={entry} depth={0} />
      ))}
    </ul>
  );
}
