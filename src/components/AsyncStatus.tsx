/** The loading/error pair the three games views each need before rendering their real content. */
export function AsyncStatus({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) {
    return <p className="p-4 text-sm text-zinc-500">読み込み中…</p>;
  }
  if (error) {
    return <p className="p-4 text-sm text-red-600 dark:text-red-400">{error}</p>;
  }
  return null;
}
