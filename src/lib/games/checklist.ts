/**
 * Parses/toggles the `- [ ]` / `- [x]` checklists that make up the actual
 * progress-tracking layer of `Games/` notes (frontmatter `status` tracks the
 * note as a whole; these track the sub-tasks within it — see the vault's own
 * CLAUDE.md, which says explicitly not to double-track the two).
 *
 * Operates on raw markdown content (line array), so a `line` index here maps
 * 1:1 onto `content.split("\n")` — including when `content` is a whole file
 * with frontmatter still attached. Frontmatter's `key: value` lines never
 * match the checklist pattern, so there's no need to strip it first, and
 * keeping the same numbering as the full file means a toggle can be written
 * straight back with a whole-file PUT (see `src/lib/api-client.ts#saveFile`).
 */

import type { ChecklistItem } from "@/types/games";

const CHECKLIST_RE = /^(\t*)- \[([ xX])\](.*)$/;

export function parseChecklist(content: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  content.split("\n").forEach((line, index) => {
    const match = CHECKLIST_RE.exec(line);
    if (!match) return;
    const [, tabs, mark, rest] = match;
    items.push({
      line: index,
      depth: tabs.length,
      checked: mark.toLowerCase() === "x",
      label: rest.trim(),
    });
  });
  return items;
}

/** Flips the checkbox on one line; no-ops if the line isn't a checklist item. */
export function toggleChecklistLine(content: string, lineIndex: number): string {
  const lines = content.split("\n");
  const line = lines[lineIndex];
  if (line === undefined) return content;
  const match = CHECKLIST_RE.exec(line);
  if (!match) return content;
  const [, tabs, mark, rest] = match;
  const nextMark = mark.toLowerCase() === "x" ? " " : "x";
  lines[lineIndex] = `${tabs}- [${nextMark}]${rest}`;
  return lines.join("\n");
}
