import { SearchBox } from "@/components/SearchBox";
import { FileTree } from "@/components/FileTree";
import { NewFileButton } from "@/components/NewFileButton";

export function Sidebar() {
  return (
    <div className="relative flex h-full w-full flex-col">
      <SearchBox />
      <FileTree />
      <NewFileButton />
    </div>
  );
}
