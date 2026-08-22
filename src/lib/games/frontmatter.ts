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
