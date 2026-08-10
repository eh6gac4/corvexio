/**
 * Builds an /edit/... href from a raw vault path, and decodes it back on the
 * other end. Next.js (16.2) does NOT decode catch-all route segments, so the
 * [...path] page's params.path elements arrive still percent-encoded as
 * produced here — decodeEditPath() is the matching counterpart.
 */
export function editHref(path: string): string {
  return `/edit/${path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

/**
 * Decodes a [...path] route's params.path segments back into a raw vault
 * path. Segments from outside editHref (hand-typed or externally shared
 * URLs) may contain invalid escapes, so each segment falls back to its raw
 * form rather than letting decodeURIComponent throw.
 */
export function decodeEditPath(segments: string[]): string {
  return segments
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}
