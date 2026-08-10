"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Editor } from "@/components/Editor";
import { EditorToolbar } from "@/components/EditorToolbar";
import { deleteFile, fetchFile, saveFile } from "@/lib/api-client";

interface PageProps {
  params: Promise<{ path: string[] }>;
}

export default function EditPage({ params }: PageProps) {
  const { path: pathSegments } = use(params);
  // Next.js (16.2) does not decode catch-all route segments, so paths built
  // by editHref()'s per-segment encodeURIComponent arrive here still encoded.
  // Segments from outside editHref (hand-typed or externally shared URLs)
  // may contain invalid escapes, so fall back to the raw segment rather
  // than letting decodeURIComponent throw and crash the page.
  const path = pathSegments
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");

  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  const [initialValue, setInitialValue] = useState<string | null>(isNew ? "" : null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The isNew case is already fully represented by the initial useState
    // values above (value/initialValue: "", loading: false) — nothing to sync.
    if (isNew) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFile(path)
      .then((file) => {
        if (cancelled) return;
        setValue(file.content);
        setInitialValue(file.content);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, isNew]);

  const dirty = initialValue !== null && value !== initialValue;

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (dirty) e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await saveFile(path, value);
      setInitialValue(value);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [path, value]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm(`"${path}" を削除しますか?`)) return;
    try {
      await deleteFile(path);
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    }
  }, [path, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <EditorToolbar
        path={path}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      {error && (
        <p className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}
      <div className="flex-1 overflow-hidden">
        <Editor value={value} onChange={setValue} />
      </div>
    </div>
  );
}
