"use client";

/**
 * Shared tap-to-select chip row. Used both as a read-only filter (game list
 * view) and as a mutable field editor (note detail view) — the visual is
 * identical, only what `onChange` does differs.
 */
export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1 text-xs ${
            option === value
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
