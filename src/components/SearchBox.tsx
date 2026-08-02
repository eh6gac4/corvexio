"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/lib/useDebounce";
import { search } from "@/lib/api-client";
import { SearchResults } from "@/components/SearchResults";
import type { SearchResultItem } from "@/types/vault";

const MIN_QUERY_LENGTH = 2;

export function SearchBox() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const trimmedQuery = debouncedQuery.trim();
  const queryTooShort = trimmedQuery.length < MIN_QUERY_LENGTH;

  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Below the minimum length there's nothing to fetch; queryTooShort (derived
    // from debouncedQuery) already hides any stale results/error/loading below.
    if (queryTooShort) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    search(trimmedQuery)
      .then((items) => {
        if (!cancelled) setResults(items);
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
  }, [trimmedQuery, queryTooShort]);

  return (
    <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Vaultを検索…"
        aria-label="Vaultを検索"
        className="w-full rounded border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
      />
      {!queryTooShort && loading && <p className="mt-2 text-xs text-zinc-500">検索中…</p>}
      {!queryTooShort && error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {!queryTooShort && results && <SearchResults results={results} />}
    </div>
  );
}
