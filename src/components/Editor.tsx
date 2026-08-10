"use client";

import dynamic from "next/dynamic";
import { markdown } from "@codemirror/lang-markdown";
import { usePrefersDark } from "@/lib/usePrefersDark";

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
  const prefersDark = usePrefersDark();

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      // uiw's default theme hardcodes a white editor background but leaves
      // text color to inherit from the page, so without this the page's
      // dark-mode foreground color renders as light text on a white editor.
      theme={prefersDark ? "dark" : "light"}
      extensions={[markdown()]}
      basicSetup={{ lineNumbers: true, foldGutter: false }}
      className="h-full text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
    />
  );
}
