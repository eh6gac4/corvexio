import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { FileTree } from "@/components/FileTree";
import { NewFileButton } from "@/components/NewFileButton";

export function Sidebar() {
  return (
    <div className="relative flex h-full w-full flex-col">
      <SearchBox />
      <Link
        href="/games"
        className="mx-2 mt-1 rounded px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        🎮 ゲーム攻略
      </Link>
      <FileTree />
      <NewFileButton />
    </div>
  );
}
