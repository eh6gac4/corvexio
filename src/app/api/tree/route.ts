import { NextRequest, NextResponse } from "next/server";
import { obsidianFetchJson } from "@/lib/obsidian/client";
import {
  encodeVaultPath,
  isDirectoryEntry,
  joinVaultPath,
  stripTrailingSlash,
} from "@/lib/obsidian/paths";
import type { ObsidianDirectoryListing } from "@/lib/obsidian/types";
import type { TreeEntry } from "@/types/vault";
import { apiErrorResponse } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "";
  try {
    const encoded = encodeVaultPath(path);
    const upstreamPath = encoded ? `/vault/${encoded}/` : `/vault/`;
    const listing = await obsidianFetchJson<ObsidianDirectoryListing>(upstreamPath);

    const entries: TreeEntry[] = listing.files.map((entry) => {
      const isDirectory = isDirectoryEntry(entry);
      const name = stripTrailingSlash(entry);
      return { name, path: joinVaultPath(path, name), isDirectory };
    });

    entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(entries);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
