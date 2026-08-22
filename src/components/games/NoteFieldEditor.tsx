"use client";

import { Chips } from "@/components/games/Chips";

const STATUS_OPTIONS = ["todo", "doing", "done"] as const;
const PRIORITY_OPTIONS = ["must", "should", "could"] as const;

/**
 * Tap-to-set status/priority editor for the note detail page. Unlike the
 * game-list view's Chips (a client-side filter with an "all" option), there's
 * no "unset" chip here — clearing a field back to blank isn't a case the
 * vault's Games/ schema needs, and `value` may be `undefined` (field absent
 * from frontmatter) with no chip selected in that state.
 */
export function NoteFieldEditor({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-zinc-500">{label}:</span>
      <Chips options={options} value={value ?? ""} onChange={onChange} />
    </div>
  );
}

export function StatusEditor({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return <NoteFieldEditor label="状態" options={STATUS_OPTIONS} value={value} onChange={onChange} />;
}

export function PriorityEditor({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return <NoteFieldEditor label="優先度" options={PRIORITY_OPTIONS} value={value} onChange={onChange} />;
}
