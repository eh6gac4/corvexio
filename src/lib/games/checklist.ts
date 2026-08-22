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

/** Replaces one checklist item's label in place, keeping its indentation and checked state; no-ops if the line isn't a checklist item. */
export function setChecklistLabel(content: string, lineIndex: number, label: string): string {
  const lines = content.split("\n");
  const line = lines[lineIndex];
  if (line === undefined) return content;
  const match = CHECKLIST_RE.exec(line);
  if (!match) return content;
  const [, tabs, mark] = match;
  lines[lineIndex] = `${tabs}- [${mark}] ${label}`;
  return lines.join("\n");
}

/** Deletes one checklist line outright; no-ops if the line isn't a checklist item. */
export function removeChecklistLine(content: string, lineIndex: number): string {
  const lines = content.split("\n");
  const line = lines[lineIndex];
  if (line === undefined || !CHECKLIST_RE.test(line)) return content;
  lines.splice(lineIndex, 1);
  return lines.join("\n");
}

/**
 * Appends a new unchecked item after the last existing checklist line (so it
 * lands with its siblings rather than at the end of the file), or after the
 * `## メモ` heading for a note that has none yet, or at the very end as a
 * last resort.
 */
export function appendChecklistItem(content: string, label: string, depth = 0): string {
  const lines = content.split("\n");
  const newLine = `${"\t".repeat(depth)}- [ ] ${label}`;

  let lastChecklistIndex = -1;
  let memoHeadingIndex = -1;
  lines.forEach((line, index) => {
    if (CHECKLIST_RE.test(line)) lastChecklistIndex = index;
    if (memoHeadingIndex < 0 && /^##\s*メモ/.test(line)) memoHeadingIndex = index;
  });

  const insertAfter = lastChecklistIndex >= 0 ? lastChecklistIndex : memoHeadingIndex;
  if (insertAfter < 0) {
    lines.push(newLine);
  } else {
    lines.splice(insertAfter + 1, 0, newLine);
  }
  return lines.join("\n");
}
