import { parseChecklist } from "@/lib/games/checklist";
import { parseFrontmatter, type FrontmatterValue } from "@/lib/games/frontmatter";
import { decodeVaultSegment } from "@/lib/vault-route";
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
 * Rebuilds a note's vault path from a `[slug]/[note]` route pair.
 *
 * This decode is required, not optional, in this app's actual runtime
 * (`output: "standalone"` + `node server.js`, i.e. how it's built and run
 * in Docker/Portainer): `[slug]`/`[note]` arrive from the router still
 * percent-encoded, same as the `/edit/[...path]` catch-all (see
 * `decodeEditPath` in src/lib/vault-route.ts). Without it, the raw `%XX`
 * sequences get encoded a second time downstream (encodeVaultPath ->
 * obsidianFetch) and the vault 404s.
 *
 * This was removed once already (assuming Next.js auto-decodes ordinary
 * dynamic segments) and broke every non-ASCII filename in production —
 * reproduced against a real N100 deployment (upstream logged
 * `%25E7%25A0...` double-encoded paths) and re-verified locally by running
 * the actual `node .next/standalone/.../server.js` binary (not `next dev`,
 * where the difference doesn't show) and clicking through real Games/
 * notes, including one with an emoji filename. Don't remove it again
 * without repeating that same standalone-server verification — a static
 * read of Next.js's route-decoding docs does not settle this for this
 * codebase's runtime.
 */
export function decodeGameNotePath(slug: string, note: string): string {
  return `Games/${decodeVaultSegment(slug)}/${decodeVaultSegment(note)}`;
}
