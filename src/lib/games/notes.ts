import { parseChecklist } from "@/lib/games/checklist";
import { parseFrontmatter, type FrontmatterValue } from "@/lib/games/frontmatter";
import { DEFAULT_NOTE_TYPE, type GameNote } from "@/types/games";

function asString(value: FrontmatterValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** A note's display title is just its filename, sans extension — used both when building the aggregate list and on the detail page. */
export function noteTitle(path: string): string {
  const fileName = path.split("/").pop() ?? path;
  return fileName.replace(/\.md$/, "");
}

/**
 * Builds a GameNote from a vault path + raw file content, or null if the
 * note has no `game` field — i.e. it isn't a `Games/` note per the vault's
 * own schema (this stays lenient rather than throwing, since a malformed
 * note shouldn't break the whole aggregate listing).
 */
export function buildGameNote(path: string, content: string): GameNote | null {
  const { data } = parseFrontmatter(content);
  const game = asString(data.game);
  if (!game) return null;

  return {
    path,
    game,
    type: asString(data.type) ?? DEFAULT_NOTE_TYPE,
    status: asString(data.status),
    priority: asString(data.priority),
    updated: asString(data.updated),
    title: noteTitle(path),
    // Parsed from the full file (not just the body) so line numbers match
    // what a client-side toggle-and-save round trip needs — see checklist.ts.
    checklist: parseChecklist(content),
  };
}

/** Builds the `/games/<game>/<file>` href for a note's detail page. */
export function gameNoteHref(game: string, path: string): string {
  const fileName = path.split("/").pop() ?? path;
  return `/games/${encodeURIComponent(game)}/${encodeURIComponent(fileName)}`;
}

/**
 * Rebuilds a note's vault path from a `[slug]/[note]` route pair. Unlike
 * `/edit/[...path]` (a catch-all, which Next.js does NOT auto-decode — see
 * `decodeEditPath` in src/lib/vault-route.ts), `[slug]` and `[note]` are
 * ordinary dynamic segments, which Next.js DOES decode before handing them
 * to the page. Decoding again here would double-decode a `%` in a filename.
 */
export function decodeGameNotePath(slug: string, note: string): string {
  return `Games/${slug}/${note}`;
}
