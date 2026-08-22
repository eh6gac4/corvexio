/** Shapes shared between /api/games and the games UI. */

export interface ChecklistItem {
  line: number;
  depth: number;
  checked: boolean;
  label: string;
}

/** The implicit default when a note's frontmatter omits `type` — most Games/ notes are plain tasks. */
export const DEFAULT_NOTE_TYPE = "todo";

export interface GameNote {
  path: string;
  game: string;
  /** `todo` | `info` | `index` per the vault's Games/ schema, but left loose here. */
  type: string;
  status?: string;
  priority?: string;
  updated?: string;
  title: string;
  checklist: ChecklistItem[];
}
