"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchTree } from "@/lib/api-client";
import { editHref } from "@/lib/vault-route";
import type { TreeEntry } from "@/types/vault";

interface Props {
  entry: TreeEntry;
  depth: number;
}

export function FileTreeNode({ entry, depth }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<TreeEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  const indent = 12 + depth * 16;

  async function toggle() {
    if (!expanded && children === null) {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchTree(entry.path);
        setChildren(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((prev) => !prev);
  }

  if (entry.isDirectory) {
    return (
      <li>
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center gap-1.5 rounded py-2.5 pr-3 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          style={{ paddingLeft: indent }}
        >
          <span className="w-3 shrink-0 text-zinc-400">{expanded ? "▾" : "▸"}</span>
          <span className="truncate">{entry.name}</span>
        </button>
        {expanded && (
          <ul>
            {loading && (
              <li className="py-1.5 text-xs text-zinc-500" style={{ paddingLeft: indent + 20 }}>
                読み込み中…
              </li>
            )}
            {error && (
              <li className="py-1.5 text-xs text-red-600" style={{ paddingLeft: indent + 20 }}>
                {error}
              </li>
            )}
            {children?.map((child) => (
              <FileTreeNode key={child.path} entry={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const href = editHref(entry.path);
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        className={`block truncate rounded py-2.5 pr-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
          isActive ? "bg-zinc-200 font-medium dark:bg-zinc-700" : ""
        }`}
        style={{ paddingLeft: indent + 18 }}
      >
        {entry.name}
      </Link>
    </li>
  );
}
