"use client";

import type { FileContent, SearchResultItem, StatusResult, TreeEntry } from "@/types/vault";
import type { GameNote } from "@/types/games";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new Error(
      (body as { error?: string } | undefined)?.error ??
        `Request failed with status ${response.status}`,
    );
  }
  return (await response.json()) as T;
}

export function fetchTree(path: string): Promise<TreeEntry[]> {
  const params = new URLSearchParams();
  if (path) params.set("path", path);
  return request<TreeEntry[]>(`/api/tree?${params.toString()}`);
}

export function fetchFile(path: string): Promise<FileContent> {
  return request<FileContent>(`/api/file?path=${encodeURIComponent(path)}`);
}

export function saveFile(path: string, content: string): Promise<{ path: string }> {
  return request<{ path: string }>(`/api/file?path=${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export function deleteFile(path: string): Promise<{ path: string }> {
  return request<{ path: string }>(`/api/file?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  });
}

export function search(query: string): Promise<SearchResultItem[]> {
  return request<SearchResultItem[]>(`/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
}

export function fetchStatus(): Promise<StatusResult> {
  return request<StatusResult>(`/api/status`);
}

export function fetchGames(): Promise<GameNote[]> {
  return request<GameNote[]>(`/api/games`);
}
