import { NextResponse } from "next/server";
import { obsidianFetchJson, obsidianFetchText } from "@/lib/obsidian/client";
import {
  encodeVaultPath,
  isDirectoryEntry,
  joinVaultPath,
  stripTrailingSlash,
} from "@/lib/obsidian/paths";
import type { ObsidianDirectoryListing } from "@/lib/obsidian/types";
import { buildGameNote } from "@/lib/games/notes";
import type { GameNote } from "@/types/games";
import { apiErrorResponse } from "@/lib/api-error";

const GAMES_ROOT = "Games";

/**
 * The Local REST API's directory listing is one level at a time, so this
 * walks it recursively. `Games/` is small (a couple of per-game folders,
 * ~15 lines per note) so there's no pagination concern here.
 */
async function listMarkdownFilesRecursive(dirPath: string): Promise<string[]> {
  const encoded = encodeVaultPath(dirPath);
  const upstreamPath = encoded ? `/vault/${encoded}/` : `/vault/`;
  const listing = await obsidianFetchJson<ObsidianDirectoryListing>(upstreamPath);

  const nested = await Promise.all(
    listing.files.map(async (entry) => {
      const name = stripTrailingSlash(entry);
      const childPath = joinVaultPath(dirPath, name);
      if (isDirectoryEntry(entry)) return listMarkdownFilesRecursive(childPath);
      return name.endsWith(".md") ? [childPath] : [];
    }),
  );
  return nested.flat();
}

export async function GET() {
  try {
    // No caching here, deliberately — same reasoning as obsidianFetch
    // bypassing Next's fetch-cache layer (src/lib/obsidian/client.ts): the
    // vault is mutable, and this same feature's checklist toggle (PUT via
    // /api/file) writes straight through it, so a stale games list would
    // show pre-toggle progress right after the toggle that caused it.
    const paths = await listMarkdownFilesRecursive(GAMES_ROOT);
    const notes = await Promise.all(
      paths.map(async (path) => {
        const content = await obsidianFetchText(`/vault/${encodeVaultPath(path)}`);
        return buildGameNote(path, content);
      }),
    );

    const data = notes.filter((note): note is GameNote => note !== null);
    return NextResponse.json(data);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
