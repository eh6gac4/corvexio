"use client";

import dynamic from "next/dynamic";
import { markdown } from "@codemirror/lang-markdown";

// next/dynamic's ssr:false option can only be used from inside a Client
// Component in the App Router, hence this whole module being 'use client'.
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      エディタを読み込み中…
    </div>
  ),
});

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function Editor({ value, onChange }: Props) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      extensions={[markdown()]}
      basicSetup={{ lineNumbers: true, foldGutter: false }}
      className="h-full text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
    />
  );
}
