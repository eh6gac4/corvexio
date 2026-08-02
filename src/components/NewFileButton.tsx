"use client";

import { useRouter } from "next/navigation";
import { editHref } from "@/lib/vault-route";

export function NewFileButton() {
  const router = useRouter();

  function handleClick() {
    const input = window.prompt("新規ファイルのパスを入力してください(例: Notes/Memo.md)");
    if (!input) return;
    const path = input.endsWith(".md") ? input : `${input}.md`;
    router.push(`${editHref(path)}?new=true`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="新規ファイル"
      className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-2xl leading-none text-white shadow-lg hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
    >
      +
    </button>
  );
}
