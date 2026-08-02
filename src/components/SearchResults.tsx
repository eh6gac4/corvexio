import Link from "next/link";
import { editHref } from "@/lib/vault-route";
import type { SearchResultItem } from "@/types/vault";

export function SearchResults({ results }: { results: SearchResultItem[] }) {
  if (results.length === 0) {
    return <p className="mt-2 text-xs text-zinc-500">一致する結果がありません。</p>;
  }

  return (
    <ul className="mt-2 max-h-80 overflow-y-auto">
      {results.map((result) => (
        <li key={result.path}>
          <Link
            href={editHref(result.path)}
            className="block rounded px-2 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <div className="truncate font-medium">{result.path}</div>
            {result.matches[0] && (
              <div className="truncate text-xs text-zinc-500">{result.matches[0].context}</div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
