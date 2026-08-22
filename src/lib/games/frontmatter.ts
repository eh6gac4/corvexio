/**
 * Minimal YAML frontmatter parser scoped to the strict, self-imposed schema
 * documented in the vault's own CLAUDE.md for `Games/` notes (see
 * `game`/`type`/`status`/`priority`/`updated`/`tags`/`source`/`parent`/`next`).
 * A real YAML parser would be overkill for a format this constrained — this
 * only needs to handle `key: value`, `key: [a, b]`, and quoted values, and
 * must never throw on a line it doesn't recognize (unrelated vault notes may
 * not follow this schema at all).
 */

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export type FrontmatterValue = string | string[];

export interface ParsedFrontmatter {
  data: Record<string, FrontmatterValue>;
  body: string;
}

function parseValue(raw: string): FrontmatterValue | undefined {
  const value = raw.trim();
  if (!value) return undefined; // empty scalar (e.g. `platform:`) — treated as unset
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const match = FRONTMATTER_RE.exec(content);
  if (!match) return { data: {}, body: content };

  const [, yamlBlock, body] = match;
  const data: Record<string, FrontmatterValue> = {};

  for (const line of yamlBlock.split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    if (!key) continue;
    const value = parseValue(line.slice(separator + 1));
    if (value !== undefined) data[key] = value;
  }

  return { data, body };
}

/** Strips a `[[wikilink]]` value down to its display text, if present. */
export function stripWikilink(value: string): string {
  const match = /^\[\[(.+)\]\]$/.exec(value.trim());
  return match ? match[1] : value;
}

/**
 * Rewrites one frontmatter key's value in place, preserving every other line
 * verbatim (comments, key order, values this parser doesn't understand).
 * Regenerating the whole block from `parseFrontmatter`'s output would silently
 * drop anything outside its documented schema, so this only ever touches the
 * one line it's asked about — same "minimal rewrite" approach as
 * `checklist.ts#toggleChecklistLine`.
 *
 * If the key exists, replaces its line. If the key is missing but a
 * frontmatter block exists, appends the line at the end of the block. If
 * there's no frontmatter block at all, prepends a new one containing only
 * this key.
 */
export function setFrontmatterField(content: string, key: string, value: string): string {
  const newLine = `${key}: ${value}`;
  const match = FRONTMATTER_RE.exec(content);
  if (!match) {
    return `---\n${newLine}\n---\n${content}`;
  }

  const [full, yamlBlock, body] = match;
  const lines = yamlBlock.split("\n");
  const index = lines.findIndex((line) => {
    const separator = line.indexOf(":");
    return separator >= 0 && line.slice(0, separator).trim() === key;
  });

  if (index >= 0) {
    lines[index] = newLine;
  } else {
    lines.push(newLine);
  }

  return (
    content.slice(0, match.index) +
    `---\n${lines.join("\n")}\n---\n${body}` +
    content.slice(match.index + full.length)
  );
}

export interface NoteTemplateFields {
  game: string;
  type: string;
  status?: string;
  priority?: string;
  title: string;
}

/**
 * Today's date as `YYYY-MM-DD`, matching the vault's `updated:` convention.
 * Uses the local calendar date, not `toISOString()`'s UTC date — the vault
 * lives on a JST host, so a naive UTC-based `updated:` would be wrong for
 * the first 9 hours of every local day.
 */
export function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Builds a brand-new note's full content: a frontmatter block matching the
 * vault's Games/ schema, plus the `## メモ` section its checklist notes use.
 */
export function buildNoteTemplate({ game, type, status, priority, title }: NoteTemplateFields): string {
  const lines = [`game: ${game}`, `type: ${type}`];
  if (status) lines.push(`status: ${status}`);
  if (priority) lines.push(`priority: ${priority}`);
  lines.push(`updated: ${todayIso()}`);
  return `---\n${lines.join("\n")}\n---\n\n# ${title}\n\n## メモ\n`;
}
